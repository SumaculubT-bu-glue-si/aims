
'use client';

import React, { createContext, useContext, useTransition, useCallback, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TransitionContextType {
  isPending: boolean;
  navigate: (url: string) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function useTransitionContext() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransitionContext must be used within a TransitionProvider');
  }
  return context;
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [showLoading, setShowLoading] = useState(false);
  const router = useRouter();

  // Add a minimum display time for the loading overlay to prevent flashing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isPending) {
      setShowLoading(true);
    } else {
      // Keep loading visible for at least 300ms to prevent flashing
      timeoutId = setTimeout(() => {
        setShowLoading(false);
      }, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPending]);

  const navigate = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url);
      });
    },
    [router]
  );

  return (
    <TransitionContext.Provider value={{ isPending: showLoading, navigate }}>
      {children}
    </TransitionContext.Provider>
  );
}

    