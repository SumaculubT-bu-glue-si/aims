'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader } from 'lucide-react';
import type { SystemUser } from '@/lib/schemas/settings';

// Mock user for local authentication
const MOCK_USER = {
  uid: 'local-admin-001',
  displayName: 'Local Admin',
  email: 'admin@localhost',
  photoURL: '',
};

interface AuthContextType {
  user: typeof MOCK_USER | null;
  loading: boolean;
  appUser: SystemUser | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<typeof MOCK_USER | null>(null);
  const [appUser, setAppUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for stored authentication
    const storedAuth = localStorage.getItem('local-auth');
    
    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/employee-audits'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setUser(authData.user);
      setAppUser(authData.appUser);
      
      if (pathname === '/login') {
        router.push('/');
      }
    } else {
      // Only redirect to login if it's not a public route
      if (!isPublicRoute) {
        router.push('/login');
      }
    }
    
    setLoading(false);
  }, [router, pathname]);

  const signInWithGoogle = async () => {
    // Mock Google sign-in
    await signInWithEmailPassword('admin@localhost', 'password');
  };

  const signInWithEmailPassword = async (email: string, pass: string) => {
    try {
      // Simple mock authentication - in a real app, you'd validate credentials
      const mockAppUser: SystemUser = {
        id: MOCK_USER.uid,
        uid: MOCK_USER.uid,
        displayName: MOCK_USER.displayName,
        email: MOCK_USER.email,
        photoURL: MOCK_USER.photoURL,
        role: 'Admin', // Default to Admin for local development
        lastLogin: new Date(),
      };

      setUser(MOCK_USER);
      setAppUser(mockAppUser);
      
      // Store authentication state
      localStorage.setItem('local-auth', JSON.stringify({
        user: MOCK_USER,
        appUser: mockAppUser
      }));
      
      router.push('/');
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setAppUser(null);
      localStorage.removeItem('local-auth');
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signInWithGoogle, signInWithEmailPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};