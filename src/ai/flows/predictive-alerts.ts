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
  currentTrafficConditions: z.string().describe('The current traffic conditions along the route (e.g., from Google Maps).'),
  weatherConditions: z.string().describe('The current weather conditions.'),
  liveTrafficReports: z.array(z.string()).describe('An array of live traffic reports from users or other sources like Reddit/News.'),
});
export type PredictiveAlertsInput = z.infer<typeof PredictiveAlertsInputSchema>;

const PredictiveAlertsOutputSchema = z.object({
  alerts: z.array(
    z.object({
      type: z.string().describe('The type of alert (e.g., Accident, Road Closure, Congestion, Weather Warning, Infrastructure Issue).'),
      location: z.string().describe('The location of the potential incident.'),
      description: z.string().describe('A detailed description of the potential incident.'),
      relevance: z.number().describe('A number between 0 and 1 indicating the relevance of the alert to the user (higher is more relevant).'),
      confidence: z.number().describe('A number between 0 and 1 indicating the confidence level of the prediction.'),
      recommendedAction: z.string().describe('A suggested action for the user to take.'),
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
  prompt: `You are an AI assistant for Bengaluru traffic that provides predictive alerts. Based on the following data, generate proactive alerts for a trip from {{{origin}}} to {{{destination}}}.

Analyze these patterns and reports:
- Identify emerging issues that may affect traffic in the next 2-4 hours.
- Detect recurring problems that suggest infrastructure issues (e.g., repeated power outage reports).
- Predict weather-related traffic impacts.
- Prioritize alerts by potential impact and user subscriptions.
- For each alert, provide a type, location, description, relevance score (0-1), confidence score (0-1), and a recommended action.

Current Traffic: {{{currentTrafficConditions}}}
Weather: {{{weatherConditions}}}
Live Reports:
{{#each liveTrafficReports}}
- {{{this}}}
{{/each}}

Generate predictive alerts in the specified JSON format.`,
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
