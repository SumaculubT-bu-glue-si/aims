
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/locations');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
