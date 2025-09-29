
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing license optimization recommendations.
 *
 * - licenseOptimizationRecommendations - A function that provides license optimization recommendations based on software usage analysis.
 * - LicenseOptimizationInput - The input type for the licenseOptimizationRecommendations function.
 * - LicenseOptimizationOutput - The return type for the licenseOptimizationRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LicenseOptimizationInputSchema = z.object({
  softwareInventory: z
    .string()
    .describe(
      'A detailed report of the current software inventory, including number of licenses held, utilization rate, and associated costs.'
    ),
  userUsageData: z
    .string()
    .describe(
      'Data on individual user software usage, including frequency of use, features used, and duration of use.'
    ),
  subscriptionDetails: z
    .string()
    .describe(
      'Information on software subscriptions, including renewal dates, subscription levels, and costs.'
    ),
  language: z
    .string()
    .describe('The language for the response (e.g., "en" or "ja").'),
});
export type LicenseOptimizationInput = z.infer<typeof LicenseOptimizationInputSchema>;

const LicenseOptimizationOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'A list of specific recommendations for optimizing software licenses, such as downgrading unused licenses, identifying redundant software, and consolidating subscriptions.'
    ),
  costSavingsEstimate: z
    .string()
    .describe(
      'An estimate of the potential cost savings (in Japanese Yen, ¥) that could be achieved by implementing the recommended license optimizations.'
    ),
});
export type LicenseOptimizationOutput = z.infer<typeof LicenseOptimizationOutputSchema>;

export async function licenseOptimizationRecommendations(
  input: LicenseOptimizationInput
): Promise<LicenseOptimizationOutput> {
  return licenseOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'licenseOptimizationPrompt',
  input: {schema: LicenseOptimizationInputSchema},
  output: {schema: LicenseOptimizationOutputSchema},
  prompt: `You are an AI assistant specializing in providing software license optimization recommendations.

  Analyze the provided software inventory, user usage data, and subscription details to identify cost-saving opportunities.

  Based on your analysis, provide specific recommendations for optimizing software licenses, such as downgrading unused licenses, identifying redundant software, and consolidating subscriptions.

  Also, estimate the potential cost savings in Japanese Yen (¥) that could be achieved by implementing the recommended license optimizations.
  
  Please provide your response in the following language: {{language}}.

  Here is the software inventory:
  {{softwareInventory}}

  Here is the user usage data:
  {{userUsageData}}

  Here are the subscription details:
  {{subscriptionDetails}}`,
});

const licenseOptimizationFlow = ai.defineFlow(
  {
    name: 'licenseOptimizationFlow',
    inputSchema: LicenseOptimizationInputSchema,
    outputSchema: LicenseOptimizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
