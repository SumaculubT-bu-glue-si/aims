
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LicenseKeyDisplayProps {
    licenseKey?: string;
    className?: string;
}

export default function LicenseKeyDisplay({ licenseKey, className }: LicenseKeyDisplayProps) {
    const [isVisible, setIsVisible] = useState(false);

    if (!licenseKey) {
        return <span className="text-muted-foreground">-</span>;
    }

    const toggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents row click when toggling visibility
        setIsVisible(!isVisible);
    };

    const maskedKey = '****-****-****-' + licenseKey.slice(-4);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="font-mono text-sm">
                {isVisible ? licenseKey : maskedKey}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleVisibility}
                aria-label={isVisible ? 'Hide license key' : 'Show license key'}
            >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    );
}
