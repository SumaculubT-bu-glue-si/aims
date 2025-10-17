
'use server';
/**
 * @fileOverview AI agent for subscription analysis.
 *
 * - getSubscriptionInsights - Analyzes subscription data and provides insights.
 * - SubscriptionInsightsInput - The input type for the getSubscriptionInsights function.
 * - SubscriptionInsightsOutput - The return type for the getSubscriptionInsights function.
 */

import { ai } from '@/ai/genkit';
import { useI18n } from '@/hooks/use-i18n';
import { z } from 'genkit';


const BillingCycleSchema = z.object({
    unit: z.enum(['day', 'week', 'month', 'year']),
    period: z.number(),
}).optional();

const AccountSchema = z.object({
    accountId: z.string(),
    assignedUser: z.string().optional(),
    assignedDevice: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    renewalDate: z.string().optional(),
    amount: z.number(),
    currency: z.enum(['JPY', 'USD']),
    billingCycle: BillingCycleSchema,
    version: z.string().optional(),
    licenseKey: z.string().optional(),
});

const PerUserPricingSchema = z.object({
    monthly: z.number().optional(),
    yearly: z.number().optional(),
    currency: z.enum(['JPY', 'USD']),
});

const AssignedUserSchema = z.object({
    employeeId: z.string(),
    assignedDate: z.string(),
});

const SubscriptionSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['active', 'inactive']),
    licenseType: z.enum(['subscription', 'perpetual']),
    pricingType: z.enum(['per-license', 'per-seat']),
    accounts: z.array(AccountSchema),
    assignedUsers: z.array(AssignedUserSchema).optional(),
    perUserPricing: PerUserPricingSchema.optional(),
    vendor: z.string().optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    website: z.string().optional(),
    supportPage: z.string().optional(),
    notes: z.string().optional(),
    cancellationDate: z.string().optional(),
});

const SubscriptionInsightsInputSchema = z.object({
    subscriptions: z.array(SubscriptionSchema),
    lang: z.enum(['en']).default('en'),
});
export type SubscriptionInsightsInput = z.infer<typeof SubscriptionInsightsInputSchema>;

const SubscriptionInsightsOutputSchema = z.string();
export type SubscriptionInsightsOutput = z.infer<typeof SubscriptionInsightsOutputSchema>;

export async function getSubscriptionInsights(input: SubscriptionInsightsInput): Promise<SubscriptionInsightsOutput> {
    return subscriptionInsightsFlow(input);
}

const getPromptText = (lang: 'en') => {
    const { t } = useI18n();
    return `
${t('ai.prompt.system')}
${t('ai.prompt.instruction')}

${t('ai.prompt.pricingTypeInfo')}

${t('ai.prompt.billingCycleInfo')}

${t('ai.prompt.currentDate')}

${t('ai.prompt.analysisPoints.title')}
1. ${t('ai.prompt.analysisPoints.1')}
2. ${t('ai.prompt.analysisPoints.2')}
3. ${t('ai.prompt.analysisPoints.3')}
4. ${t('ai.prompt.analysisPoints.4')}
5. ${t('ai.prompt.analysisPoints.5')}
6. ${t('ai.prompt.analysisPoints.6')}

${t('ai.prompt.formatInstruction')}

${t('ai.prompt.subscriptionData')}
\`\`\`json
{{{json subscriptions}}}
\`\`\`
`;
}

const subscriptionInsightsFlow = ai.defineFlow(
    {
        name: 'subscriptionInsightsFlow',
        inputSchema: SubscriptionInsightsInputSchema,
        outputSchema: SubscriptionInsightsOutputSchema,
    },
    async (input) => {
        const { subscriptions, lang } = input;
        const promptText = getPromptText(lang);

        const prompt = ai.definePrompt({
            name: `subscriptionInsightsPrompt-${lang}`,
            prompt: promptText,
            input: {
                schema: z.object({
                    subscriptions: z.any(),
                    currentDate: z.string()
                })
            },
            output: { schema: SubscriptionInsightsOutputSchema },
        });

        const currentDate = new Date().toLocaleDateString('en-CA');

        const subscriptionsWithUsage = subscriptions.map(sub => {
            let usageRate = 0;
            if (sub.pricingType === 'per-license') {
                const usedCount = sub.accounts.filter(a => a.assignedUser || a.assignedDevice).length;
                const totalCount = sub.accounts.length;
                usageRate = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;
            } else { // per-seat
                usageRate = sub.assignedUsers && sub.assignedUsers.length > 0 ? 100 : 0;
            }

            return {
                ...sub,
                usageRate
            };
        });

        const { output } = await prompt({
            subscriptions: subscriptionsWithUsage,
            currentDate,
        });
        return output || '';
    }
);
