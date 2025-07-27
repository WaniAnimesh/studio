'use server';
/**
 * @fileOverview Route analysis AI agent.
 *
 * - analyzeRoute - A function that handles the route analysis process.
 * - RouteAnalysisInput - The input type for the analyzeRoute function.
 * - RouteAnalysisOutput - The return type for the analyzeRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RouteAnalysisInputSchema = z.object({
  origin: z.string().describe('The starting point of the route.'),
  destination: z.string().describe('The end point of the route.'),
  trafficData: z.string().describe('Current traffic conditions, e.g., "Heavy congestion at Silk Board junction, 45-60 min delays"'),
  weatherData: z.string().describe('Current weather conditions, e.g., "Light showers expected 3-5 PM, potential waterlogging on ORR"'),
});
export type RouteAnalysisInput = z.infer<typeof RouteAnalysisInputSchema>;

const RouteAnalysisOutputSchema = z.object({
  trafficAnalysis: z.string().describe('A summary of the current traffic situation between the origin and destination.'),
  weatherImpact: z.string().describe('An analysis of how the current and predicted weather will impact the route.'),
  aiRecommendation: z.object({
      primary: z.string().describe('The main recommended route or action.'),
      alternative: z.string().describe('An alternative route or mode of transport.'),
      avoid: z.string().describe('Specific routes or areas to avoid.'),
  }),
  bestDepartureTime: z.string().describe('The suggested best time to start the journey.'),
  prediction: z.string().describe('A prediction of how traffic is likely to change.'),
});
export type RouteAnalysisOutput = z.infer<typeof RouteAnalysisOutputSchema>;

export async function analyzeRoute(input: RouteAnalysisInput): Promise<RouteAnalysisOutput> {
  return analyzeRouteFlow(input);
}

const routeAnalysisTool = ai.defineTool(
    {
        name: 'getRouteAnalysis',
        description: 'Generates optimal route advice for Bengaluru travel from origin to destination.',
        inputSchema: RouteAnalysisInputSchema,
        outputSchema: RouteAnalysisOutputSchema,
    },
    async (input) => {
        // This tool now uses the AI to generate a more dynamic analysis
        // instead of returning hardcoded strings.
        const llmResponse = await ai.generate({
            prompt: `
              Analyze the following travel request for Bengaluru and provide a detailed advisory.

              Origin: ${input.origin}
              Destination: ${input.destination}
              Current Traffic: ${input.trafficData}
              Current Weather: ${input.weatherData}

              Based on this data, generate:
              1.  A brief analysis of the traffic situation.
              2.  A description of how weather will impact the trip.
              3.  A primary recommendation (e.g., a specific route).
              4.  An alternative recommendation (e.g., another route or metro).
              5.  A route or area to avoid.
              6.  The best suggested departure time.
              7.  A prediction for how traffic might change.
            `,
            output: {
                schema: RouteAnalysisOutputSchema,
            }
        });

        return llmResponse.output!;
    }
);


const prompt = ai.definePrompt({
  name: 'routeAnalysisPrompt',
  tools: [routeAnalysisTool],
  input: {schema: RouteAnalysisInputSchema},
  output: {schema: RouteAnalysisOutputSchema},
  prompt: `Generate optimal route advice for a trip in Bengaluru from {{{origin}}} to {{{destination}}}.

You MUST use the getRouteAnalysis tool to get the analysis.

Pass the following information to the tool:
- origin: {{{origin}}}
- destination: {{{destination}}}
- trafficData: {{{trafficData}}}
- weatherData: {{{weatherData}}}

Synthesize the tool's output to provide a clear, actionable travel plan. The response should consider all factors to give the user a comprehensive understanding of their journey.`,
});

const analyzeRouteFlow = ai.defineFlow(
  {
    name: 'analyzeRouteFlow',
    inputSchema: RouteAnalysisInputSchema,
    outputSchema: RouteAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
