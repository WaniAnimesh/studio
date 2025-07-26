"use server";

import { analyzeRoute } from "@/ai/flows/route-analysis";
import { getPredictiveAlerts } from "@/ai/flows/predictive-alerts";
import type { TravelAdvice } from "@/types";
import { getRedditTrafficReports } from "@/services/reddit";
import { getNewsTrafficReports } from "@/services/news";
import { getCurrentWeather, type WeatherData } from "@/services/weather";

// Helper to summarize weather data for the AI prompt
const formatWeatherDataForAI = (weather: WeatherData | null): string => {
  if (!weather) return "Weather data not available.";
  return `Current temperature is ${weather.temp}°C, with ${weather.description}. Wind speed is ${weather.wind_speed} m/s.`;
};


export async function getTravelAdvice(data: {
  origin: string;
  destination: string;
}): Promise<TravelAdvice> {
  try {
    const { origin, destination } = data;

    // Fetch live data in parallel
    const [redditReports, newsReports, weatherData] = await Promise.all([
      getRedditTrafficReports(),
      getNewsTrafficReports(),
      getCurrentWeather(),
    ]);

    const liveTrafficReports = [
      ...redditReports.map(r => r.title),
      ...newsReports.map(n => n.title),
    ];
    
    // Create a concise summary of traffic reports for one of the AI inputs
    const trafficDataSummary = liveTrafficReports.length > 0 
      ? liveTrafficReports.slice(0, 5).join('; ') 
      : "No major incidents reported.";

    const weatherDataSummary = formatWeatherDataForAI(weatherData);

    // Using Promise.all to run AI flows in parallel for better performance
    const [routeAnalysis, predictiveAlerts] = await Promise.all([
      analyzeRoute({ 
        origin, 
        destination, 
        trafficData: trafficDataSummary, 
        weatherData: weatherDataSummary 
      }),
      getPredictiveAlerts({ 
        origin, 
        destination, 
        currentTrafficConditions: trafficDataSummary, // Using summary for this as well
        weatherConditions: weatherDataSummary, 
        liveTrafficReports 
      }),
    ]);

    return { 
      routeAnalysis, 
      predictiveAlerts,
      liveTrafficReports,
      weather: weatherData || { temp: 0, description: 'N/A' }, // Provide default weather if fetch fails
    };

  } catch (error) {
    console.error("Error getting travel advice:", error);
    // Provide a user-friendly error message
    throw new Error("Failed to get travel advice from our AI. Please try again.");
  }
}
