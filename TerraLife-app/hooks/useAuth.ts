// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../app/context/auth';

export default function useAuth() {
  return useContext(AuthContext);
}