'use server';
/**
 * @fileOverview An AI flow to generate asset field configurations from legacy CSV data.
 *
 * - generateAssetFieldsFromCsv - A function that suggests asset fields based on CSV headers.
 * - GenerateAssetFieldsInput - The input type for the function.
 * - GenerateAssetFieldsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAssetFieldsInputSchema = z.object({
  csvData: z
    .string()
    .describe('A sample of CSV data, including at least the header row, from a legacy asset management system.'),
});
export type GenerateAssetFieldsInput = z.infer<typeof GenerateAssetFieldsInputSchema>;

const SuggestedFieldSchema = z.object({
  originalHeader: z.string().describe('The original header from the CSV file that this field maps to.'),
  name: z.string().describe('A concise and clear name for the asset field in Japanese.'),
  dataType: z.enum(['Text', 'Number', 'Date']).describe('The most appropriate data type for the field.'),
  notes: z.string().describe('A brief explanation of what this field represents. This should also be in Japanese.'),
});

const GenerateAssetFieldsOutputSchema = z.object({
  fields: z.array(SuggestedFieldSchema).describe('An array of suggested asset fields based on the provided CSV data.'),
});
export type GenerateAssetFieldsOutput = z.infer<typeof GenerateAssetFieldsOutputSchema>;


export async function generateAssetFieldsFromCsv(
  input: GenerateAssetFieldsInput
): Promise<GenerateAssetFieldsOutput> {
  return generateAssetFieldsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssetFieldsPrompt',
  input: {schema: GenerateAssetFieldsInputSchema},
  output: {schema: GenerateAssetFieldsOutputSchema},
  prompt: `You are an expert data migration specialist for IT asset management systems.
Your task is to analyze the provided CSV data (header and potentially sample rows) from a legacy system and propose a new set of asset field definitions for the new system.

For each column in the CSV, you must suggest a field definition with the following properties:
- originalHeader: The exact header name from the original CSV data.
- name: A user-friendly field name in Japanese. Clean up the original column name if necessary (e.g., "purchase_price" -> "購入価格").
- dataType: The most appropriate data type. Choose from 'Text', 'Number', or 'Date'. For identifiers, MAC addresses, IPs, use 'Text'. For prices or counts, use 'Number'. For dates, use 'Date'.
- notes: A brief, helpful description of the field in Japanese.

It is crucial that you identify the corresponding originalHeader for each field you suggest.

Analyze the following CSV data:
{{{csvData}}}

Generate a list of suggested field definitions.
`,
});

const generateAssetFieldsFlow = ai.defineFlow(
  {
    name: 'generateAssetFieldsFlow',
    inputSchema: GenerateAssetFieldsInputSchema,
    outputSchema: GenerateAssetFieldsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
