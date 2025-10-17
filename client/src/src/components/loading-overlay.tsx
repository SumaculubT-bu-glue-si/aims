'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTransitionContext } from '@/context/transition-context';
import { useI18n } from '@/hooks/use-i18n';

export function LoadingOverlay() {
  const { isPending } = useTransitionContext();
  const { t } = useI18n();

  if (!isPending) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="flex flex-col items-center gap-4 p-4 sm:p-6 rounded-lg animate-in zoom-in-95 duration-200 max-w-sm w-full">
        <div className="relative">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full "></div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center">
          {t('actions.loading')}
        </p>
      </div>
    </div>
  );
}
