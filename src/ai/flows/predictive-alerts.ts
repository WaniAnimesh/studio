'use server';

/**
 * @fileOverview Predictive Alerts flow that informs users of potential incidents along their route.
 *
 * - getPredictiveAlerts - A function that retrieves predictive alerts for a given route.
 * - PredictiveAlertsInput - The input type for the getPredictiveAlerts function.
 * - PredictiveAlertsOutput - The return type for the getPredictiveAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveAlertsInputSchema = z.object({
  origin: z.string().describe('The starting point of the route.'),
  destination: z.string().describe('The end point of the route.'),
  currentTrafficConditions: z.string().describe('The current traffic conditions along the route (clear, moderate, heavy).'),
  weatherConditions: z.string().describe('The current weather conditions along the route.'),
  liveTrafficReports: z.array(z.string()).describe('An array of live traffic reports from users.'),
});
export type PredictiveAlertsInput = z.infer<typeof PredictiveAlertsInputSchema>;

const PredictiveAlertsOutputSchema = z.object({
  alerts: z.array(
    z.object({
      type: z.string().describe('The type of alert (e.g., accident, road closure, congestion).'),
      location: z.string().describe('The location of the potential incident.'),
      description: z.string().describe('A detailed description of the potential incident.'),
      relevance: z.number().describe('A number between 0 and 1 indicating the relevance of the alert to the user (higher is more relevant).'),
    })
  ).describe('An array of predictive alerts.'),
});
export type PredictiveAlertsOutput = z.infer<typeof PredictiveAlertsOutputSchema>;

export async function getPredictiveAlerts(input: PredictiveAlertsInput): Promise<PredictiveAlertsOutput> {
  return predictiveAlertsFlow(input);
}

const predictiveAlertsPrompt = ai.definePrompt({
  name: 'predictiveAlertsPrompt',
  input: {schema: PredictiveAlertsInputSchema},
  output: {schema: PredictiveAlertsOutputSchema},
  prompt: `You are an AI assistant that provides predictive alerts for travelers.

  Based on the origin, destination, current traffic conditions, weather conditions, and live traffic reports, you will predict potential incidents along the route.
  Each alert should have a type, location, description, and relevance score (0 to 1).

  Origin: {{{origin}}}
  Destination: {{{destination}}}
  Current Traffic Conditions: {{{currentTrafficConditions}}}
  Weather Conditions: {{{weatherConditions}}}
  Live Traffic Reports:
  {{#each liveTrafficReports}}
  - {{{this}}}
  {{/each}}

  Provide predictive alerts in the following JSON format:
  {{json alerts=[{type: string, location: string, description: string, relevance: number}]}}`,
});

const predictiveAlertsFlow = ai.defineFlow(
  {
    name: 'predictiveAlertsFlow',
    inputSchema: PredictiveAlertsInputSchema,
    outputSchema: PredictiveAlertsOutputSchema,
  },
  async input => {
    const {output} = await predictiveAlertsPrompt(input);
    return output!;
  }
);
