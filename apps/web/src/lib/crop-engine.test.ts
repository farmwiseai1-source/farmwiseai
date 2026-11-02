import { describe, expect, it } from "vitest";
import { evaluateCrops } from "./crop-engine";

const catalog = [
  { id: "rice", name: "Rice", source_reference: "source", rule_data: { soils: ["Black"], water: "high" as const, season_keywords: ["kharif"], temperature_c: { min: 20, max: 35 }, rainfall_mm: { min: 1000, max: 2500 } } },
  { id: "millet", name: "Pearl millet", source_reference: "source", rule_data: { soils: ["Sandy"], water: "low" as const, season_keywords: ["kharif"], temperature_c: { min: 25, max: 35 }, rainfall_mm: { min: 250, max: 700 } } },
];

describe("phase 4 crop engine", () => {
  it("is deterministic and explains the score", () => {
    const input = { soilType: "Sandy", season: "Kharif · Monsoon", waterAvailability: "Limited" as const, temperatureC: 30, rainfallMm: 500 };
    const first = evaluateCrops(catalog, input); const second = evaluateCrops(catalog, input);
    expect(first).toEqual(second); expect(first[0].name).toBe("Pearl millet"); expect(first[0].reasons.length).toBeGreaterThan(0);
  });
  it("reports missing weather inputs instead of inventing them", () => {
    const result = evaluateCrops(catalog, { soilType: "Black", season: "Kharif", waterAvailability: "Reliable", temperatureC: null, rainfallMm: null });
    expect(result[0].insufficientData).toEqual(["temperature", "rainfall"]); expect(result[0].limitations.join(" ")).toContain("Missing");
  });
});
