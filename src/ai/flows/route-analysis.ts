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
        // Placeholder implementation for route analysis. In a real app, this would
        // involve complex logic combining data from multiple sources.
        return {
            trafficAnalysis: `Simulated analysis: Traffic is currently heavy on the Outer Ring Road near ${input.origin}. ${input.trafficData}.`,
            weatherImpact: `Simulated impact: ${input.weatherData} could lead to slower speeds and reduced visibility.`,
            aiRecommendation: {
                primary: `Take the NICE Road to bypass city center traffic.`,
                alternative: `Consider using the Namma Metro Green Line towards ${input.destination}.`,
                avoid: `Avoid Silk Board junction due to a reported accident.`,
            },
            bestDepartureTime: 'Leave before 3 PM or after 8 PM to avoid peak hours.',
            prediction: 'Traffic is expected to worsen in the next hour due to evening rush.',
        };
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
