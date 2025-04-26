// app/context/auth.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { router } from 'expo-router';
import { ref, set } from 'firebase/database'; // Import these to write to the Realtime Database
import { database } from '../../config/firebase'; // Ensure database is initialized

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const defaultData = {
        // main system
        system0: { 
          systemName: "TerraLife Main System",
          humidity: 0,  // Humidity in percentage
          sprinklerStatus: 'OFF', // 'ON' or 'OFF'
          temperature: 0,  // Temperature in Celsius
          lastUpdated: "00:00:00 MM/DD/YYYY",  // Will store the timestamp when data is updated
        },

        // variant systems
        system1: {
          systemName: "TerraLife Variant 1",
          battery: 0,  // Battery percentage
          soilMoisture1: 0,  // Soil moisture level for sensor 1
          soilMoisture2: 0,  // Soil moisture level for sensor 2
          lastUpdated: "00:00:00 MM/DD/YYYY",  // Will store the timestamp when data is updated
          enable: true, // true meaning it will appear in the UI.
        }
      };
      

      // Save default data to Realtime Database under the user's UID
      const userRef = ref(database, `users/${newUser.uid}`);
      await set(userRef, defaultData);

      // Redirect user to the home screen after signup
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this default export to fix the error
export default function AuthContextProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}