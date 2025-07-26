"use server";

import { analyzeRoute } from "@/ai/flows/route-analysis";
import { getPredictiveAlerts } from "@/ai/flows/predictive-alerts";
import type { TravelAdvice } from "@/types";

export async function getTravelAdvice(data: {
  origin: string;
  destination: string;
}): Promise<TravelAdvice> {
  try {
    const { origin, destination } = data;

    // In a real application, these would be fetched from live data sources.
    const staticData = {
      trafficData: "Heavy congestion at Silk Board junction, 45-60 min delays",
      weatherData: "Light showers expected 3-5 PM, potential waterlogging on ORR",
      currentTrafficConditions: "moderate",
      weatherConditions: "Partly cloudy, 28°C",
      liveTrafficReports: [
        "Accident reported near Marathahalli bridge.",
        "Heavy congestion on Outer Ring Road towards Tin Factory.",
        "Procession on MG Road causing delays.",
      ],
    };

    // Using Promise.all to run AI flows in parallel for better performance
    const [routeAnalysis, predictiveAlerts] = await Promise.all([
      analyzeRoute({ origin, destination, trafficData: staticData.trafficData, weatherData: staticData.weatherData }),
      getPredictiveAlerts({ origin, destination, currentTrafficConditions: staticData.currentTrafficConditions, weatherConditions: staticData.weatherConditions, liveTrafficReports: staticData.liveTrafficReports }),
    ]);

    return { routeAnalysis, predictiveAlerts };
  } catch (error) {
    console.error("Error getting travel advice:", error);
    // Provide a user-friendly error message
    throw new Error("Failed to get travel advice from our AI. Please try again.");
  }
}
