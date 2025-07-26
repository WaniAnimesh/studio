import type { RouteAnalysisOutput } from '@/ai/flows/route-analysis';
import type { PredictiveAlertsOutput } from '@/ai/flows/predictive-alerts';
import { WeatherData } from '@/services/weather';

export type TravelAdvice = {
  routeAnalysis: RouteAnalysisOutput;
  predictiveAlerts: PredictiveAlertsOutput;
  liveTrafficReports: string[];
  weather: WeatherData;
};

export type Alert = PredictiveAlertsOutput['alerts'][0];
