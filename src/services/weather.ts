/**
 * @fileoverview Service for fetching current weather data from OpenWeatherMap.
 */
import fetch from 'node-fetch';

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
// Bengaluru coordinates
const BENGALURU_LAT = 12.9716;
const BENGALURU_LON = 77.5946;

export interface WeatherData {
  temp: number;
  description: string;
  wind_speed: number;
  icon: string;
}

/**
 * Fetches the current weather for Bengaluru.
 * @returns A promise that resolves to the weather data.
 */
export async function getCurrentWeather(): Promise<WeatherData | null> {
  if (!WEATHER_API_KEY) {
    console.warn("OpenWeatherMap API key is not configured. Skipping weather fetch.");
    return null;
  }

  try {
    const response = await fetch(`${WEATHER_API_URL}?lat=${BENGALURU_LAT}&lon=${BENGALURU_LON}&appid=${WEATHER_API_KEY}&units=metric`);

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Invalid OpenWeatherMap API key.");
      } else if (response.status === 429) {
        console.warn("Rate limit exceeded for OpenWeatherMap API.");
      } else {
        throw new Error(`OpenWeatherMap API request failed with status: ${response.status}`);
      }
      return null;
    }

    const data: any = await response.json();

    if (data && data.weather && data.main) {
      return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        wind_speed: data.wind.speed,
        icon: data.weather[0].icon,
      };
    } else {
      console.warn("Received unexpected data structure from OpenWeatherMap API");
      return null;
    }

  } catch (error) {
    console.error("Error fetching data from OpenWeatherMap API:", error);
    return null;
  }
}
