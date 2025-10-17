'use client';

import React from 'react';
import { useTransitionContext } from '@/context/transition-context';

export function PageTransitionLoader() {
  const { isPending } = useTransitionContext();

  if (!isPending) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
      <div className="h-full bg-primary animate-pulse" style={{ animationDuration: '1s' }}></div>
    </div>
  );
}
