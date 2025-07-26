import type { RouteAnalysisOutput } from '@/ai/flows/route-analysis';
import type { PredictiveAlertsOutput } from '@/ai/flows/predictive-alerts';

export type TravelAdvice = {
  routeAnalysis: RouteAnalysisOutput;
  predictiveAlerts: PredictiveAlertsOutput;
};

export type Alert = PredictiveAlertsOutput['alerts'][0];
