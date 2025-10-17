'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader } from 'lucide-react';
import type { SystemUser } from '@/lib/schemas/settings';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  appUser: SystemUser | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [appUser, setAppUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Check for user info from secure cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth');
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.user) {
            const authUser: AuthUser = {
              uid: userData.user.id,
              displayName: userData.user.name,
              email: userData.user.email,
              photoURL: '',
            };
            
            const appUser: SystemUser = {
              id: userData.user.id,
              uid: userData.user.id,
              displayName: userData.user.name,
              email: userData.user.email,
              photoURL: '',
              role: 'Admin',
              lastLogin: new Date(),
            };

            setUser(authUser);
            setAppUser(appUser);
            
            if (pathname === '/login') {
              router.push('/');
            }
          } else {
            // No valid authentication
            if (pathname !== '/login' && !pathname.startsWith('/employee-audits')) {
              router.push('/login');
            }
          }
        } else if (response.status === 401) {
          // 401 Unauthorized is expected when user is not logged in
          // Handle it silently without logging as an error
          if (pathname !== '/login' && !pathname.startsWith('/employee-audits')) {
            router.push('/login');
          }
        } else {
          // Other HTTP errors (500, 404, etc.)
          console.error('Auth check failed with status:', response.status);
          if (pathname !== '/login' && !pathname.startsWith('/employee-audits')) {
            router.push('/login');
          }
        }
      } catch (error) {
        // Only log actual network/parsing errors, not expected 401s
        console.error('Auth check failed:', error);
        if (pathname !== '/login' && !pathname.startsWith('/employee-audits')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  const signInWithGoogle = async () => {
    // Google sign-in not implemented yet
    toast({
      title: "Google Sign-In",
      description: "Google sign-in is not available yet. Please use email and password.",
      variant: "destructive",
    });
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Call secure login API route
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Create user objects for compatibility
        const authUser: AuthUser = {
          uid: result.user.id,
          displayName: result.user.name,
          email: result.user.email,
          photoURL: '',
        };
        
        const appUser: SystemUser = {
          id: result.user.id,
          uid: result.user.id,
          displayName: result.user.name,
          email: result.user.email,
          photoURL: '',
          role: 'Admin',
          lastLogin: new Date(),
        };

        setUser(authUser);
        setAppUser(appUser);
        
        // Show success toast
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.name}!`,
          variant: "default",
        });
        
        router.push('/');
      } else {
        // Handle login errors
        const errorMessage = result.error || 'Login failed';
        
        if (errorMessage.includes('Invalid credentials')) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error signing in", error);
      
      // Handle network errors or other exceptions
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Error",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Call secure logout API route
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setUser(null);
      setAppUser(null);
      
      // Show logout toast
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
      
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signInWithGoogle, signInWithEmailPassword, signOut }}>
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        children
      )}
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