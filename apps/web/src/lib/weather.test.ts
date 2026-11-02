import { describe, expect, it, vi } from "vitest";
import { fetchNormalizedWeather } from "./weather";

describe("phase 4 weather adapter", () => {
  it("normalizes a provider response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ latitude: 16.3, longitude: 80.4, timezone: "Asia/Kolkata", current: { time: "2026-10-29T12:00", temperature_2m: 30, relative_humidity_2m: 60, precipitation: 0, weather_code: 1, wind_speed_10m: 12 }, daily: { time: ["2026-10-29"], temperature_2m_max: [32], temperature_2m_min: [24], precipitation_sum: [2], precipitation_probability_max: [30] } }), { status: 200 })));
    const result = await fetchNormalizedWeather(16.3, 80.4);
    expect(result.source).toBe("Open-Meteo"); expect(result.current.temperatureC).toBe(30); expect(result.forecast[0].precipitationMm).toBe(2);
  });
  it("rejects invalid provider responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(fetchNormalizedWeather(16.3, 80.4)).rejects.toThrow("invalid response");
  });
});
