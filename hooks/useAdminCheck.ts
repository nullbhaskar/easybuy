/**
 * Custom hook to manage authentication state and admin access checks.
 *
 * Handles reading admin status from AsyncStorage and Firebase Auth,
 * then exposes a simple boolean for components to use.
 *
 * Usage:
 *   const { isAdmin, isLoading } = useAdminCheck();
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminCheckResult {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdminCheck(): AdminCheckResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { authState, user } = useAuth();

  useEffect(() => {
    setIsAdmin(authState === 'authenticated' && user?.isAdmin === true);
    setIsLoading(authState === 'loading');
  }, [authState, user?.isAdmin]);

  return { isAdmin, isLoading };
}
