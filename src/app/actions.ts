"use server";

import { analyzeRoute } from "@/ai/flows/route-analysis";
import { getPredictiveAlerts } from "@/ai/flows/predictive-alerts";
import type { TravelAdvice } from "@/types";
import { getRedditTrafficReports } from "@/services/reddit";
import { getNewsTrafficReports } from "@/services/news";

export async function getTravelAdvice(data: {
  origin: string;
  destination: string;
}): Promise<TravelAdvice> {
  try {
    const { origin, destination } = data;

    // Fetch live data in parallel
    const [redditReports, newsReports] = await Promise.all([
      getRedditTrafficReports(),
      getNewsTrafficReports(),
    ]);

    const liveTrafficReports = [
      ...redditReports.map(r => r.title),
      ...newsReports.map(n => n.title),
      // Adding some of the original static reports for more context
      "Accident reported near Marathahalli bridge.",
      "Heavy congestion on Outer Ring Road towards Tin Factory.",
      "Procession on MG Road causing delays.",
    ];

    // Static data for weather and current conditions, can be replaced with live APIs later
    const staticData = {
      trafficData: "Heavy congestion at Silk Board junction, 45-60 min delays",
      weatherData: "Light showers expected 3-5 PM, potential waterlogging on ORR",
      currentTrafficConditions: "moderate",
      weatherConditions: "Partly cloudy, 28°C",
    };

    // Using Promise.all to run AI flows in parallel for better performance
    const [routeAnalysis, predictiveAlerts] = await Promise.all([
      analyzeRoute({ origin, destination, trafficData: staticData.trafficData, weatherData: staticData.weatherData }),
      getPredictiveAlerts({ origin, destination, currentTrafficConditions: staticData.currentTrafficConditions, weatherConditions: staticData.weatherConditions, liveTrafficReports }),
    ]);

    return { routeAnalysis, predictiveAlerts };
  } catch (error) {
    console.error("Error getting travel advice:", error);
    // Provide a user-friendly error message
    throw new Error("Failed to get travel advice from our AI. Please try again.");
  }
}