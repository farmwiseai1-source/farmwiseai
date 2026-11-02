import { crops, farms, type Language } from "./farmwise-types";

export function getDashboardSummary() {
  return { farmCount: farms.length, primaryFarm: farms[0], recommendedCrop: crops[0], waterLitres: 52_400, alerts: 2 };
}

export function rankDemoCrops(input: { soil: string; water: string; season: string }) {
  return [...crops]
    .map((crop) => ({ ...crop, score: Math.max(55, crop.score + (crop.soil.includes(input.soil) ? 5 : -7) + (input.water === "Limited" && crop.water.startsWith("Low") ? 8 : 0) + (input.season.includes("Kharif") && crop.season.startsWith("Kharif") ? 2 : 0)) }))
    .sort((a, b) => b.score - a.score);
}

export function calculateIrrigation(input: { areaAcres: number; waterMm: number; rainfallMm: number; efficiencyPercent: number; pumpLitresPerMinute: number }) {
  const netMm = Math.max(0, input.waterMm - input.rainfallMm);
  const litres = (input.areaAcres * 4046.8564224 * netMm) / (input.efficiencyPercent / 100);
  const minutes = litres / input.pumpLitresPerMinute;
  return { litres, minutes, netMm };
}

export function calculateFertilizer(input: { area: number; nutrientKgPerAcre: number; compositionPercent: number }) {
  const requiredNutrientKg = input.area * input.nutrientKgPerAcre;
  return { requiredNutrientKg, productKg: requiredNutrientKg / (input.compositionPercent / 100) };
}

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
}

const advisorReplies: Record<Language, string[]> = {
  English: ["This is a demonstration response, not advice from an agricultural expert. Check your local extension guidance before acting."],
  తెలుగు: ["ఇది ప్రదర్శన సమాధానం మాత్రమే; వ్యవసాయ నిపుణుల సలహా కాదు. చర్య తీసుకునే ముందు స్థానిక వ్యవసాయ అధికారులను సంప్రదించండి."],
  हिन्दी: ["यह केवल एक प्रदर्शन उत्तर है, कृषि विशेषज्ञ की सलाह नहीं। कोई कदम उठाने से पहले स्थानीय कृषि विशेषज्ञ से पुष्टि करें।"],
};
export function getDemoAdvisorReply(language: Language) { return advisorReplies[language][0]; }

export const demoSchemas = {
  recommendation: { minArea: 0.01, maxArea: 100_000 },
  irrigation: { minEfficiency: 1, maxEfficiency: 100, minFlow: 0.1 },
  fertilizer: { minComposition: 0.1, maxComposition: 100 },
};
