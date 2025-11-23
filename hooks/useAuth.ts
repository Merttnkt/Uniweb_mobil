import { useAuth as useAuthContext, type AuthContextType } from '@/contexts/AuthContext';

export type { AuthContextType };

export function useAuth() {
  return useAuthContext();
}
