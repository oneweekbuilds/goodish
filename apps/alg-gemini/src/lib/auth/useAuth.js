import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

/**
 * useAuth hook
 * Access auth context in components
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
