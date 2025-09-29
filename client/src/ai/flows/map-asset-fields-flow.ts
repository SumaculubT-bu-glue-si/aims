'use server';
/**
 * @fileOverview An AI flow to map CSV headers to predefined asset fields.
 *
 * - mapAssetFieldsFromCsv - A function that suggests mappings between CSV headers and system fields.
 * - MapAssetFieldsInput - The input type for the function.
 * - MapAssetFieldsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SystemFieldSchema = z.object({
  id: z.string().describe('The unique identifier of the system field.'),
  name: z.string().describe('The display name of the system field.'),
});

const MapAssetFieldsInputSchema = z.object({
  csvHeaders: z.array(z.string()).describe('An array of header strings from the CSV file.'),
  systemFields: z.array(SystemFieldSchema).describe('An array of available system fields to map to.'),
});
export type MapAssetFieldsInput = z.infer<typeof MapAssetFieldsInputSchema>;

const MappingSchema = z.object({
    systemFieldId: z.string().describe('The ID of the system field.'),
    csvHeader: z.string().nullable().describe('The matched header from the CSV file. Null if no match was found.'),
});

const MapAssetFieldsOutputSchema = z.object({
  mappings: z.array(MappingSchema).describe('An array of mappings from system field ID to CSV header.'),
});
export type MapAssetFieldsOutput = z.infer<typeof MapAssetFieldsOutputSchema>;


export async function mapAssetFieldsFromCsv(
  input: MapAssetFieldsInput
): Promise<MapAssetFieldsOutput> {
  return mapAssetFieldsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mapAssetFieldsPrompt',
  input: {schema: MapAssetFieldsInputSchema},
  output: {schema: MapAssetFieldsOutputSchema},
  prompt: `You are an expert data migration assistant. Your task is to map headers from a CSV file to a predefined list of system fields for an IT asset management system.

You will be given a list of CSV headers and a list of system fields. For each system field, you must determine which CSV header is the best match.

The system fields are:
{{#each systemFields}}
- ID: {{id}}, Name: "{{name}}"
{{/each}}

The headers from the uploaded CSV file are:
{{#each csvHeaders}}
- "{{this}}"
{{/each}}

Based on the information above, generate a list of mappings.
Each mapping must contain the 'systemFieldId' and the corresponding 'csvHeader'.
If you cannot find a suitable match for a system field, the 'csvHeader' should be null.
Analyze the names carefully, considering common abbreviations and Japanese/English equivalents (e.g., '製造番号(S/N)' should match 'Serial Number').
Prioritize exact matches, but also find logical mappings for variations.
`,
});

const mapAssetFieldsFlow = ai.defineFlow(
  {
    name: 'mapAssetFieldsFlow',
    inputSchema: MapAssetFieldsInputSchema,
    outputSchema: MapAssetFieldsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
