import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  // Function to handle support contact
  const contactSupport = () => {
    Linking.openURL('mailto:alexisbryledongallo@gmail.com');
  };

  // User Guide Section
  const UserGuide = () => {
    return (
      <View style={styles.userGuideContainer}>
        <View style={styles.headerContainer}>
          <Ionicons name="leaf" size={28} color="#2E7D32" />
          <Text style={styles.mainTitle}>Welcome to TerraLife</Text>
        </View>
        
        <Text style={styles.tagline}>Smart IoT-based irrigation for sustainable farming</Text>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle-outline" size={24} color="#2E7D32" />
            <Text style={styles.guideTitle}>Getting Started</Text>
          </View>
          <Text style={styles.guideText}>
            To start using the app, please ensure your irrigation system is set up with the ESP32 device and connected to Wi-Fi.
          </Text>
          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>1</Text></View>
            <Text style={styles.guideText}>Assemble the hardware (ESP32, sensors, and water pump).</Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>2</Text></View>
            <Text style={styles.guideText}>Flash the ESP32 with the necessary firmware.</Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>3</Text></View>
            <Text style={styles.guideText}>Download the TerraLife mobile app and create an account or log in.</Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>4</Text></View>
            <Text style={styles.guideText}>Connect the app to your system by scanning the QR code or entering the system ID.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={24} color="#2E7D32" />
            <Text style={styles.guideTitle}>Using the App</Text>
          </View>
          <Text style={styles.guideText}>
            You can monitor and control your irrigation system from the app:
          </Text>
          <View style={styles.bulletPoint}>
            <Ionicons name="water-outline" size={18} color="#2E7D32" />
            <Text style={styles.guideText}>View real-time soil moisture levels and irrigation status.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Ionicons name="timer-outline" size={18} color="#2E7D32" />
            <Text style={styles.guideText}>Manually trigger irrigation or set up automatic schedules.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Ionicons name="notifications-outline" size={18} color="#2E7D32" />
            <Text style={styles.guideText}>Get notified when irrigation happens or when moisture levels are low.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="build-outline" size={24} color="#2E7D32" />
            <Text style={styles.guideTitle}>Troubleshooting</Text>
          </View>
          <Text style={styles.guideText}>If you experience issues, please try the following:</Text>
          <View style={styles.bulletPoint}>
            <Ionicons name="wifi-outline" size={18} color="#2E7D32" />
            <Text style={styles.guideText}>Ensure that the ESP32 is connected to the Wi-Fi network.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Ionicons name="refresh-outline" size={18} color="#2E7D32" />
            <Text style={styles.guideText}>Restart the app or refresh the connection.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Ionicons name="flash-outline" size={18} color="#2E7D32" />
            <Text style={styles.guideText}>If the water pump is not working, check the wiring or relay connections.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={24} color="#2E7D32" />
            <Text style={styles.guideTitle}>Contact Support</Text>
          </View>
          <Text style={styles.guideText}>For additional assistance, please contact:</Text>
          <TouchableOpacity style={styles.supportButton} onPress={contactSupport}>
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={styles.supportButtonText}>Alexis Bryle A. Dongallo</Text>
          </TouchableOpacity>
          <Text style={styles.emailText}>alexisbryledongallo@gmail.com</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color="#2E7D32" />
            <Text style={styles.guideTitle}>Acknowledgements</Text>
          </View>
          <Text style={styles.guideText}>TerraLife is brought to you by:</Text>
          <View style={styles.teamContainer}>
            {[
              "Abello, Jamaica May A.",
              "Agbay, Jhanine D.",
              "Cabrera, Alleyah Aida A.",
              "Capangpangan, Jeanette S.",
              "Carias, Eman B.",
              "Ceballos, Nikki B.",
              "Dimco, Dexter E.",
              "Dongallo, Alexis Bryle A.",
              "Eronico, Angelo",
              "Juntilla, Jaustfer P.",
              "Maningo, Hope Charmaine B.",
              "Naingue, Christian Noel C.",
              "Pardo, Kent Laurence B.",
              "Pepito, Julie Faith"
            ].map((name, index) => (
              <View key={index} style={styles.teamMember}>
                <Ionicons name="person-circle-outline" size={16} color="#2E7D32" />
                <Text style={styles.memberName}>{name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.advisor}>
            <Ionicons name="school-outline" size={18} color="#2E7D32" />
            <Text style={styles.advisorName}>Engr. Donald R. Lalican, MEIE, PIE</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Guide Section */}
      <UserGuide />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 15,
    backgroundColor: '#FBFBFB',
  },
  userGuideContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#2E7D32',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#2E7D32',
  },
  guideText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
    color: '#333',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 5,
  },
  stepBadge: {
    backgroundColor: '#2E7D32',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 5,
  },
  supportButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  emailText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  teamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
  },
  advisor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f3f8f3',
    borderRadius: 8,
  },
  advisorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
});