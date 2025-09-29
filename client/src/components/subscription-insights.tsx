
'use client';

import { useState } from 'react';
import { WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeSubscriptions } from '@/lib/actions';
import type { Subscription } from '@/lib/types';
import { Skeleton } from './ui/skeleton';


interface SubscriptionInsightsProps {
    subscriptions: Subscription[];
}

export default function SubscriptionInsights({ subscriptions }: SubscriptionInsightsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setInsights(null);
        try {
            const result = await analyzeSubscriptions(subscriptions);
            setInsights(result);
        } catch (e) {
            setError('An error occurred during analysis.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>AI Subscription Analysis</CardTitle>
                        <CardDescription>AI analyzes your contract status and suggests improvements.</CardDescription>
                    </div>
                    <Button onClick={handleAnalyze} disabled={isLoading} size="sm">
                        <WandSparkles className="mr-2 h-4 w-4" />
                        {isLoading ? 'Analyzing...' : 'Analyze with AI'}
                    </Button>
                </div>
            </CardHeader>
            {(isLoading || insights || error) && (
                <CardContent>
                    {isLoading && (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    )}
                    {error && (
                        <p className="text-destructive">{error}</p>
                    )}
                    {insights && (
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                            {insights}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
