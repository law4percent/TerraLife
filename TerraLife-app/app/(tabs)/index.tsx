import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Modal,
  StatusBar,
  SafeAreaView,
  Switch,
  Alert
} from 'react-native';
import { AuthContext } from '../context/auth';
import { useUserData } from '../../hooks/useUserData';
import { ref, set, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// app/(tabs)/index.tsx
export default function HomeScreen() {
  const { user, signOut } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isSprinklerLoading, setIsSprinklerLoading] = useState(false);
  const [sprinklerStatus, setSprinklerStatus] = useState('');
  const [newSystemName, setNewSystemName] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('system0');
  const [systemCount, setSystemCount] = useState(0);
  const [systemKeys, setSystemKeys] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Use the custom hook to fetch user data
  const { userData, loading: userLoading, error } = useUserData(user?.uid);

  async function registerForPushNotificationsAsync() {
    let token;
    
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Notification Permission', 'Failed to get push token for notifications!', [
          { text: 'OK' }
        ]);
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Store token in Firebase
      if (user?.uid && token) {
        const tokenRef = ref(database, `users/${user.uid}/notificationToken`);
        await set(tokenRef, token);
      }
    } else {
      Alert.alert('Physical Device Required', 'Must use physical device for Push Notifications', [
        { text: 'OK' }
      ]);
    }

    return token;
  }


  // Send notification
  const sendNotification = async (title: string, body: string, systemKey: string, notificationType: string) => {
    if (!notificationsEnabled) return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { systemKey },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  

  // Check for notification conditions
  const checkNotificationConditions = async () => {
    if (!userData || !notificationsEnabled) return;
    
    // Main system temperature alert
    if (userData.system0 && userData.system0.temperature > 36) {
      await sendNotification(
        'High Temperature Alert',
        `Temperature is ${userData.system0.temperature}°C - Your plants may be at risk!`,
        'system0',
        'temperature'
      );
    }
    
    // Check all systems for battery and moisture levels
    Object.keys(userData).forEach(async (key) => {
      if (key.startsWith('system') && key !== 'system0') {
        const system = userData[key];
        
        // Low battery alert
        if (system.battery !== undefined && system.battery < 20) {
          await sendNotification(
            'Low Battery Alert',
            `${system.systemName || key} battery is at ${system.battery}% - Please replace soon.`,
            key,
            'battery'
          );
        }
        
        // Low soil moisture alerts
        if (system.soilMoisture1 !== undefined && system.soilMoisture1 < 40) {
          await sendNotification(
            'Low Soil Moisture Alert',
            `${system.systemName || key} - Sensor 1 soil moisture is low (${system.soilMoisture1}%).`,
            key,
            'moisture1'
          );
        }
        
        if (system.soilMoisture2 !== undefined && system.soilMoisture2 < 40) {
          await sendNotification(
            'Low Soil Moisture Alert',
            `${system.systemName || key} - Sensor 2 soil moisture is low (${system.soilMoisture2}%).`,
            key,
            'moisture2'
          );
        }
      }
    });
  };

  useEffect(() => {
    if (userData) {
      setLoading(false);
      setSprinklerStatus(userData?.system0?.sprinklerStatus);
      
      // Get all system keys and sort them
      const keys = Object.keys(userData).filter(key => key.startsWith('system')).sort();
      setSystemKeys(keys);
      setSystemCount(keys.length);

      // Register for notifications
      const setupNotifications = async () => {
        await registerForPushNotificationsAsync();
        
        // Load notification preference from storage
        try {
          const notifSetting = await AsyncStorage.getItem('notificationsEnabled');
          if (notifSetting !== null) {
            setNotificationsEnabled(notifSetting === 'true');
          }
        } catch (error) {
          console.error('Error loading notification settings:', error);
        }
      };
      
      setupNotifications();
    }
  }, [userData]);

  // Toggle notifications
  const toggleNotifications = async (value: boolean | ((prevState: boolean) => boolean)) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  // Loading state when fetching data
  if (userLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/628/628324.png' }} 
          style={styles.logoSmall} 
        />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Connecting to your garden...</Text>
      </View>
    );
  }

  // Error handling
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error connecting to your garden: {error}</Text>
      </View>
    );
  }

  // Toggle Sprinkler Status for system0
  const toggleSprinklerStatus = async () => {
    setIsSprinklerLoading(true);
    const newStatus = sprinklerStatus === 'ON' ? 'OFF' : 'ON';

    try {
      const userRef = ref(database, `users/${user?.uid}/system0/sprinklerStatus`);
      await set(userRef, newStatus);
      setSprinklerStatus(newStatus);
      setIsSprinklerLoading(false);
    } catch (error) {
      setIsSprinklerLoading(false);
      console.error('Error toggling sprinkler status:', error);
    }
  };

  // Handle renaming the system
  const handleRenameSystem = async () => {
    if (!newSystemName) return;

    try {
      const userRef = ref(database, `users/${user?.uid}/${selectedSystem}/systemName`);
      await set(userRef, newSystemName);
      // setIsRenaming(false);
      setModalVisible(false);
    } catch (error) {
      console.error('Error renaming system:', error);
    }
  };
  
  // Toggle the enable property for the system
  const toggleSystemEnable = async (systemKey: string | number) => {
    const systemData = userData?.[systemKey];
    if (systemData) {
      const newEnableStatus = !systemData.enable;

      try {
        const userRef = ref(database, `users/${user?.uid}/${systemKey}/enable`);
        await set(userRef, newEnableStatus);
      } catch (error) {
        console.error('Error toggling system enable:', error);
      }
    }
  };

  // Delete system function
  const deleteSystem = async () => {
    if (!systemToDelete || systemToDelete === 'system0') {
      // Prevent deletion of main system
      return;
    }

    try {
      const systemRef = ref(database, `users/${user?.uid}/${systemToDelete}`);
      await remove(systemRef);
      setDeleteModalVisible(false);
      setSystemToDelete(null);
      
      // Update systemKeys list by removing the deleted system
      const updatedKeys = systemKeys.filter(key => key !== systemToDelete);
      setSystemKeys(updatedKeys);
      setSystemCount(updatedKeys.length);
    } catch (error) {
      console.error('Error deleting system:', error);
      Alert.alert('Error', 'Failed to delete the system. Please try again.');
    }
  };

  // Confirm deletion with an alert
  const confirmDeleteSystem = (systemKey: string) => {
    if (systemKey === 'system0') {
      Alert.alert('Cannot Delete', 'The main controller cannot be deleted');
      return;
    }
    
    setSystemToDelete(systemKey);  // systemKey is expected to be a string here
    setDeleteModalVisible(true);
  };
  
  // Find the next available system number
  const getNextSystemNumber = () => {
    if (systemKeys.length === 0) return 1;
    
    // Extract numbers from system keys and find the maximum
    const systemNumbers = systemKeys.map(key => {
      const match = key.match(/system(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    // Find the next available number
    for (let i = 1; i <= 15; i++) {
      if (!systemNumbers.includes(i)) {
        return i;
      }
    }
    
    return Math.max(...systemNumbers) + 1;
  };

  // Add new system
  const addNewSystem = async () => {
    if (systemCount < 16) {
      const nextNumber = getNextSystemNumber();
      const newSystemKey = `system${nextNumber}`;
      
      const systemData = {
        systemName: `TerraLife Variant ${nextNumber}`,
        battery: 0,
        soilMoisture1: 0,
        soilMoisture2: 0,
        lastUpdated: "00:00:00 MM/DD/YYYY",
        enable: true,
      };
      
      try {
        await set(ref(database, `users/${user?.uid}/${newSystemKey}`), systemData);
        // Update the systemKeys array with the new key
        const updatedKeys = [...systemKeys, newSystemKey].sort();
        setSystemKeys(updatedKeys);
        setSystemCount(updatedKeys.length);
      } catch (error) {
        console.error('Error adding new system:', error);
      }
    } else {
      alert('Maximum of 15 zones reached!');
    }
  };

  // Format date for better readability
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Not available';
    
    // Simply return the dateString as is, since it's already formatted in Firebase
    return String(dateString);
  };

  type ValidMoistureIconNames = 
  | "water"
  | "water-outline"
  | "warning-outline";

  // Get status icon and color based on moisture level
  const getMoistureStatus = (moisture: number): { icon: ValidMoistureIconNames; color: string; text: string } => {
    if (moisture > 90) return { icon: 'warning-outline', color: '#3F51B5', text: 'Overwatered! Warning' }; // Warning! Overwatered
    if (moisture > 70) return { icon: 'water', color: '#2196F3', text: 'Well Watered' }; // well watered
    if (moisture > 40) return { icon: 'water-outline', color: '#8BC34A', text: 'Good' }; // Good, mild water deficit
    return { icon: 'warning-outline', color: '#FF9800', text: 'Needs Water' };
  };
  
  type ValidBatteryIconNames = 
  | "battery-full"
  | "battery-half"
  | "battery-dead"
  | "battery-dead-sharp";
  // Get battery icon based on level
  const getBatteryIcon = (level: number): ValidBatteryIconNames => {
    if (level >= 75) return 'battery-full';
    if (level >= 50) return 'battery-half';
    if (level >= 25) return 'battery-dead';
    return 'battery-dead-sharp';
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F9F0" />
      
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/628/628324.png' }} 
          style={styles.logo} 
        />
        <Text style={styles.title}>TerraLife</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => toggleNotifications(!notificationsEnabled)}>
            <Ionicons 
              name={notificationsEnabled ? "notifications" : "notifications-off"} 
              size={24} 
              color="#4CAF50" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeText}>Welcome, {user?.email?.split('@')[0]}</Text>
        <Text style={styles.systemCount}>Total Variants: {systemCount - 1}/15</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {systemKeys.map((systemKey) => {
          const systemData = userData[systemKey] || {};
          const systemName = systemData?.systemName || `Zone ${systemKey.slice(-1)}`;
          const isEnabled = systemKey === 'system0' ? true : systemData?.enable !== false;
          
          return (
            <View 
              key={systemKey} 
              style={[
                styles.systemCard,
                { opacity: isEnabled ? 1 : 0.5 }
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.systemName}>{systemName}</Text>
                <View style={styles.cardHeaderButtons}>
                  <TouchableOpacity 
                    onPress={() => { 
                      setSelectedSystem(systemKey); 
                      setNewSystemName(systemName);
                      setModalVisible(true); 
                    }}
                    style={styles.headerButton}
                  >
                    <Ionicons name="create-outline" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  
                  {systemKey !== 'system0' && (
                    <TouchableOpacity 
                      onPress={() => confirmDeleteSystem(systemKey)}
                      style={styles.headerButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.cardContent}>
                {systemKey === 'system0' ? (
                  // System 1 - Irrigation Controller
                  <>
                    <View style={styles.sensorRow}>
                      <View style={styles.sensorItem}>
                        <Ionicons name="water" size={24} color="#2196F3" />
                        <Text style={styles.sensorValue}>{systemData?.humidity || 0}%</Text>
                        <Text style={styles.sensorLabel}>Humidity</Text>
                      </View>
                      
                      <View style={styles.sensorItem}>
                        <Ionicons 
                          name="thermometer" 
                          size={24} 
                          color={systemData?.temperature > 36 ? "#FF0000" : "#FF5722"} 
                        />
                        <Text 
                          style={[
                            styles.sensorValue,
                            systemData?.temperature > 36 ? styles.alertValue : {}
                          ]}
                        >
                          {systemData?.temperature || 0}°C
                          {systemData?.temperature > 36 && (
                            <Ionicons name="alert-circle" size={16} color="#FF0000" />
                          )}
                        </Text>
                        <Text style={styles.sensorLabel}>Temperature</Text>
                      </View>
                      
                      <View style={styles.sensorItem}>
                        <Ionicons name="timer-outline" size={24} color="#9C27B0" />
                        <Text style={styles.statusText}>
                          Main Controller
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.sprinklerButton,
                        { backgroundColor: sprinklerStatus === 'ON' ? '#4CAF50' : '#F5F5F5' }
                      ]}
                      onPress={toggleSprinklerStatus}
                      disabled={isSprinklerLoading}
                    >
                      <Ionicons 
                        name={sprinklerStatus === 'ON' ? "water" : "water-outline"} 
                        size={24} 
                        color={sprinklerStatus === 'ON' ? "#FFF" : "#757575"} 
                      />
                      <Text 
                        style={[
                          styles.sprinklerButtonText, 
                          { color: sprinklerStatus === 'ON' ? "#FFF" : "#757575" }
                        ]}
                      >
                        {isSprinklerLoading ? 'Updating...' : `Irrigation ${sprinklerStatus === 'ON' ? 'ON' : 'OFF'}`}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Other Systems - Soil Sensors
                  <>
                    <View style={styles.sensorRow}>
                      <View style={styles.sensorItem}>
                        <Ionicons 
                          name={getBatteryIcon(systemData?.battery)} 
                          size={24} 
                          color={systemData?.battery < 20 ? "#FF0000" : "#4CAF50"} 
                        />
                        <Text 
                          style={[
                            styles.sensorValue,
                            systemData?.battery < 20 ? styles.alertValue : {}
                          ]}
                        >
                          {systemData?.battery || 0}%
                          {systemData?.battery < 20 && (
                            <Ionicons name="alert-circle" size={16} color="#FF0000" />
                          )}
                        </Text>
                        <Text style={styles.sensorLabel}>Battery</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.enableToggle}
                        onPress={() => toggleSystemEnable(systemKey)}
                      >
                        <Switch
                          value={systemData?.enable}
                          onValueChange={() => toggleSystemEnable(systemKey)}
                          trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                          thumbColor={systemData?.enable ? '#4CAF50' : '#BDBDBD'}
                        />
                        <Text style={styles.enableLabel}>
                          {systemData?.enable ? 'Active' : 'Inactive'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.soilSection}>
                      <Text style={styles.sectionSubtitle}>Soil Moisture Sensors</Text>
                      
                      <View style={styles.soilSensors}>
                        <View style={styles.soilSensor}>
                          <View style={styles.soilIconContainer}>
                            <Ionicons 
                              name={getMoistureStatus(systemData?.soilMoisture1).icon} 
                              size={28} 
                              color={getMoistureStatus(systemData?.soilMoisture1).color} 
                            />
                            {systemData?.soilMoisture1 < 40 && (
                              <View style={styles.alertBadge}>
                                <Ionicons name="alert-circle" size={14} color="#FF0000" />
                              </View>
                            )}
                          </View>
                          <View style={styles.soilInfo}>
                            <Text style={styles.soilTitle}>Sensor 1</Text>
                            <Text style={styles.soilValue}>{systemData?.soilMoisture1 || 0}%</Text>
                            <Text style={[styles.soilStatus, { color: getMoistureStatus(systemData?.soilMoisture1).color }]}>
                              {getMoistureStatus(systemData?.soilMoisture1).text}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.soilSensor}>
                          <View style={styles.soilIconContainer}>
                            <Ionicons 
                              name={getMoistureStatus(systemData?.soilMoisture2).icon} 
                              size={28} 
                              color={getMoistureStatus(systemData?.soilMoisture2).color} 
                            />
                            {systemData?.soilMoisture2 < 40 && (
                              <View style={styles.alertBadge}>
                                <Ionicons name="alert-circle" size={14} color="#FF0000" />
                              </View>
                            )}
                          </View>
                          <View style={styles.soilInfo}>
                            <Text style={styles.soilTitle}>Sensor 2</Text>
                            <Text style={styles.soilValue}>{systemData?.soilMoisture2 || 0}%</Text>
                            <Text style={[styles.soilStatus, { color: getMoistureStatus(systemData?.soilMoisture2).color }]}>
                              {getMoistureStatus(systemData?.soilMoisture2).text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </>
                )}
                
                <Text style={styles.lastUpdated}>
                  Last Updated: {formatDate(systemData?.lastUpdated)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Add new system button */}
      <TouchableOpacity 
        style={[
          styles.floatingButton,
          // Disable the button visually when max systems reached
          systemCount >= 16 ? styles.disabledButton : {}
        ]} 
        onPress={addNewSystem}
        disabled={systemCount >= 16}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
      
      {/* Rename System Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename System</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new zone name"
              value={newSystemName}
              onChangeText={setNewSystemName}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleRenameSystem}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Delete System Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Zone</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete this zone? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={deleteSystem}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={false}  // This is hidden by default, can be shown via a settings button
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Receive Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={notificationsEnabled ? '#4CAF50' : '#BDBDBD'}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton, { width: '100%', marginTop: 16 }]} 
              onPress={() => {}}
            >
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Add any background color you prefer
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9F0', // Light green background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4CAF50',
  },
  logoSmall: {
    width: 50,
    height: 50,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  systemCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32', // Dark green
  },
  profileButton: {
    padding: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#616161',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for floating button
  },
  systemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
  },
  systemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardContent: {
    padding: 16,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sensorItem: {
    alignItems: 'center',
    width: '30%',
  },
  enableToggle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#333',
  },
  sensorLabel: {
    fontSize: 12,
    color: '#757575',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    color: '#9C27B0',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 12,
  },
  sprinklerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  sprinklerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  soilSection: {
    marginTop: 8,
  },
  soilSensors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soilSensor: {
    flexDirection: 'row',
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  soilIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  soilInfo: {
    flex: 1,
  },
  soilTitle: {
    fontSize: 12,
    color: '#757575',
  },
  soilValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  soilStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7', // Lighter green for disabled state
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E7D32',
  },
  modalDescription: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  error: {
    color: '#D32F2F',
    textAlign: 'center',
    padding: 16,
  },


  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  alertValue: {
    color: '#FF0000',
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#616161',
  }
});