'use server';
/**
 * @fileOverview An AI flow to describe an image for a civic report.
 *
 * - describeImage - A function that generates a description from an image.
 * - DescribeImageInput - The input type for the describeImage function.
 * - DescribeImageOutput - The return type for the describeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a civic issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

const DescribeImageOutputSchema = z.object({
  description: z.string().describe('A concise description of the civic issue shown in the image.'),
  department: z.string().describe('The most relevant government department to handle this issue. Must be one of: BBMP, BESCOM, BWSSB, BTP, Other.'),
  locationDescription: z.string().describe('A description of the location based on visual cues in the image. For example, "Near a specific landmark" or "On a residential street".'),
});
export type DescribeImageOutput = z.infer<typeof DescribeImageOutputSchema>;

export async function describeImage(input: DescribeImageInput): Promise<DescribeImageOutput> {
  return describeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeImagePrompt',
  input: {schema: DescribeImageInputSchema},
  output: {schema: DescribeImageOutputSchema},
  prompt: `You are an AI assistant helping a citizen report a civic issue in Bengaluru. Your task is to analyze the provided image and generate a brief, factual description of the problem, identify the responsible government department, and describe the location.

1.  **Description**: Focus on what is visually present in the image. For example, describe the pothole, overflowing garbage bin, broken streetlight, or water leakage. Avoid making assumptions about the cause unless it's visually obvious.
2.  **Department**: Based on the issue, determine the most appropriate department to handle it. The valid options are:
    *   'BBMP' (For issues like garbage, potholes, road conditions, drains)
    *   'BESCOM' (For electricity-related issues like broken streetlights, power lines)
    *   'BWSSB' (For water supply and sewage issues)
    *   'BTP' (For traffic-related issues like signal malfunctions, illegal parking)
    *   'Other' (If it does not fit in the above categories)
3.  **Location Description**: Describe the location based on any visual landmarks or context in the image.

Image to analyze: {{media url=photoDataUri}}

Generate the description, department, and location description.`,
});

const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
