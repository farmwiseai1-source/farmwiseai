import { z } from "zod";

const providerResponseSchema = z.object({
  latitude: z.number(), longitude: z.number(), timezone: z.string(),
  current: z.object({ time: z.string(), temperature_2m: z.number(), relative_humidity_2m: z.number(), precipitation: z.number(), weather_code: z.number(), wind_speed_10m: z.number() }),
  daily: z.object({ time: z.array(z.string()), temperature_2m_max: z.array(z.number()), temperature_2m_min: z.array(z.number()), precipitation_sum: z.array(z.number()), precipitation_probability_max: z.array(z.number()) }),
});

export const weatherQuerySchema = z.object({ latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180) });
export type NormalizedWeather = { source: string; fetchedAt: string; stale: boolean; location: { latitude: number; longitude: number; timezone: string }; current: { observedAt: string; temperatureC: number; humidityPercent: number; precipitationMm: number; weatherCode: number; windSpeedKmh: number }; forecast: Array<{ date: string; maxTemperatureC: number; minTemperatureC: number; precipitationMm: number; precipitationProbabilityPercent: number }> };

function weatherCodeLabel(code: number) { return code <= 3 ? "Clear to partly cloudy" : code <= 67 ? "Rain conditions" : code <= 77 ? "Snow conditions" : code <= 99 ? "Showers or thunderstorms" : "Unknown conditions"; }
export { weatherCodeLabel };

export async function fetchNormalizedWeather(latitude: number, longitude: number): Promise<NormalizedWeather> {
  const query = weatherQuerySchema.parse({ latitude, longitude });
  const baseUrl = process.env.WEATHER_API_BASE_URL || "https://api.open-meteo.com/v1";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/forecast`);
  url.search = new URLSearchParams({ latitude: String(query.latitude), longitude: String(query.longitude), timezone: "auto", forecast_days: "7", current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m", daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max" }).toString();
  const response = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  const parsed = providerResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Weather provider returned an invalid response");
  const data = parsed.data;
  return { source: "Open-Meteo", fetchedAt: new Date().toISOString(), stale: false, location: { latitude: data.latitude, longitude: data.longitude, timezone: data.timezone }, current: { observedAt: data.current.time, temperatureC: data.current.temperature_2m, humidityPercent: data.current.relative_humidity_2m, precipitationMm: data.current.precipitation, weatherCode: data.current.weather_code, windSpeedKmh: data.current.wind_speed_10m }, forecast: data.daily.time.map((date, index) => ({ date, maxTemperatureC: data.daily.temperature_2m_max[index], minTemperatureC: data.daily.temperature_2m_min[index], precipitationMm: data.daily.precipitation_sum[index], precipitationProbabilityPercent: data.daily.precipitation_probability_max[index] })) };
}
