
'use server';

import { getSubscriptionInsights } from "@/ai/flows/subscription-insights-flow";
import type { Subscription } from "./types";

export async function analyzeSubscriptions(subscriptions: Subscription[]) {
    // Language is fixed to English
    return await getSubscriptionInsights({ subscriptions, lang: 'en' });
}
