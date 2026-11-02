import { z } from "zod";

export const cropInputSchema = z.object({ soilType: z.string().min(1), season: z.string().min(1), waterAvailability: z.enum(["Reliable", "Limited", "Rain-fed", "Not sure"]), temperatureC: z.number().nullable(), rainfallMm: z.number().nullable() });
export type CropRule = { temperature_c?: { min: number; max: number }; rainfall_mm?: { min: number; max: number }; soils?: string[]; water?: "low" | "moderate" | "high"; season_keywords?: string[]; duration_days?: { min: number; max: number } };
export type CropEvaluation = { id: string; name: string; score: number; reasons: string[]; limitations: string[]; insufficientData: string[]; sourceReference: string };

export function evaluateCrops(catalog: Array<{ id: string; name: string; rule_data: CropRule; source_reference: string }>, rawInput: z.input<typeof cropInputSchema>) {
  const input = cropInputSchema.parse(rawInput);
  return catalog.map((crop): CropEvaluation => {
    const rule = crop.rule_data ?? {}; let score = 50; const reasons: string[] = []; const limitations: string[] = []; const insufficientData: string[] = [];
    if (rule.soils?.includes(input.soilType)) { score += 25; reasons.push(`Soil type ${input.soilType} is listed as suitable in the catalog rule.`); } else if (rule.soils?.length) { score -= 18; limitations.push(`The selected soil type is not in this crop’s listed soil set.`); }
    if (rule.season_keywords?.some((keyword) => input.season.toLowerCase().includes(keyword))) { score += 15; reasons.push(`The selected season matches the catalog’s ${rule.season_keywords.join("/")} window.`); } else if (rule.season_keywords?.length) { score -= 10; limitations.push("The selected season does not match the catalog season window."); }
    if (rule.water === "low" && (input.waterAvailability === "Limited" || input.waterAvailability === "Rain-fed")) { score += 12; reasons.push("Lower water availability is compatible with this crop’s lower-water rule."); }
    if (rule.water === "high" && input.waterAvailability === "Limited") { score -= 15; limitations.push("This crop’s rule expects more dependable water than the selected input."); }
    if (input.temperatureC === null) insufficientData.push("temperature"); else if (rule.temperature_c && input.temperatureC >= rule.temperature_c.min && input.temperatureC <= rule.temperature_c.max) { score += 10; reasons.push("Current temperature is within the catalog rule range."); } else if (rule.temperature_c) { score -= 12; limitations.push("Current temperature is outside the catalog rule range."); }
    if (input.rainfallMm === null) insufficientData.push("rainfall"); else if (rule.rainfall_mm && input.rainfallMm >= rule.rainfall_mm.min && input.rainfallMm <= rule.rainfall_mm.max) { score += 8; reasons.push("Recent forecast rainfall is within the catalog rule range."); } else if (rule.rainfall_mm) { score -= 8; limitations.push("Recent forecast rainfall is outside the catalog rule range."); }
    if (insufficientData.length) limitations.push(`Missing ${insufficientData.join(" and ")} data; the score is incomplete.`);
    return { id: crop.id, name: crop.name, score: Math.max(0, Math.min(100, score)), reasons, limitations, insufficientData, sourceReference: crop.source_reference };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
