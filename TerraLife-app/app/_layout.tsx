// app/_layout.tsx
import AuthContextProvider from './context/auth';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function RootLayout() {
  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User is signed in' : 'User is signed out');
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContextProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      </Stack>
    </AuthContextProvider>
  );
}