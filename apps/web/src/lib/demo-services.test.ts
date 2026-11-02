import { describe, expect, it } from "vitest";
import { calculateFertilizer, calculateIrrigation, formatDuration, rankDemoCrops } from "./demo-services";

describe("demonstration crop ranking", () => {
  it("returns ranked options and favors a low-water crop when water is limited", () => {
    const ranked = rankDemoCrops({ soil: "Sandy", water: "Limited", season: "Kharif" });
    expect(ranked).toHaveLength(3);
    expect(ranked[0].name).toBe("Pearl millet");
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });
});

describe("irrigation calculation", () => {
  it("converts one acre at 10 mm into litres and pump time", () => {
    const result = calculateIrrigation({ areaAcres: 1, waterMm: 10, rainfallMm: 0, efficiencyPercent: 100, pumpLitresPerMinute: 100 });
    expect(result.litres).toBeCloseTo(40_468.564, 2);
    expect(result.minutes).toBeCloseTo(404.6856, 3);
  });

  it("never returns a negative net depth after rainfall", () => {
    const result = calculateIrrigation({ areaAcres: 1, waterMm: 5, rainfallMm: 8, efficiencyPercent: 80, pumpLitresPerMinute: 50 });
    expect(result.netMm).toBe(0);
    expect(result.litres).toBe(0);
    expect(result.minutes).toBe(0);
  });
});

describe("fertilizer product calculation", () => {
  it("converts nutrient requirement to fertilizer product quantity", () => {
    const result = calculateFertilizer({ area: 2, nutrientKgPerAcre: 10, compositionPercent: 20 });
    expect(result.requiredNutrientKg).toBe(20);
    expect(result.productKg).toBe(100);
  });
});

describe("irrigation reminder display", () => {
  it("formats a countdown and clamps a negative remainder to zero", () => {
    expect(formatDuration(3_661)).toBe("01:01:01");
    expect(formatDuration(-5)).toBe("00:00:00");
  });
});
