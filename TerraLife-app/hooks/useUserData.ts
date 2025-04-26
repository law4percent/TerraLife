// hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

export function useUserData(uid: string | undefined) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uid) {
      const db = getDatabase();
      const userRef = ref(db, 'users/' + uid);

      // Set up real-time listener to listen for changes
      const unsubscribe = onValue(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
            setError('No user data available');
          }
          setLoading(false);
        },
        (err) => {
          setError('Error fetching user data');
          setLoading(false);
        }
      );

      // Clean up listener on component unmount
      return () => unsubscribe();
    }
  }, [uid]);

  return { userData, loading, error };
}
