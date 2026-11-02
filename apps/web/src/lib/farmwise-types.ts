export type SoilType = "Red" | "Black" | "Alluvial" | "Laterite" | "Forest / mountain" | "Desert / arid" | "Loamy" | "Sandy" | "Clay" | "Other / unknown";
export type Farm = { id: string; name: string; location: string; area: number; unit: "acres" | "hectares"; soil: SoilType; crop: string; irrigation: string };
export type CropRecommendation = { id: string; name: string; score: number; season: string; soil: string[]; water: string; image: string; explanation: string };
export type PestReport = { id: string; crop: string; label: string; confidence: string; date: string; status: "Demonstration" };
export type Activity = { id: string; title: string; detail: string; date: string; icon: "crop" | "water" | "pest" | "fertilizer" };
export type Language = "English" | "తెలుగు" | "हिन्दी";

export const demoStamp = "Demonstration data · 29 Oct 2026";
export const farms: Farm[] = [
  { id: "farm-1", name: "Greenfield Farm", location: "Guntur, Andhra Pradesh", area: 8.5, unit: "acres", soil: "Black", crop: "Rice", irrigation: "Canal" },
  { id: "farm-2", name: "Mango Grove", location: "Vijayawada, Andhra Pradesh", area: 4, unit: "acres", soil: "Loamy", crop: "Mango", irrigation: "Drip" },
];
export const crops: CropRecommendation[] = [
  { id: "rice", name: "Rice", score: 91, season: "Kharif · Jun–Oct", soil: ["Black", "Alluvial", "Clay"], water: "High · 1,200–1,500 mm", image: "/images/crop-detail.jpg", explanation: "Demonstration fit based on the selected soil and water availability. Confirm local planting dates with an extension officer." },
  { id: "groundnut", name: "Groundnut", score: 84, season: "Kharif · Jun–Sep", soil: ["Sandy", "Loamy", "Red"], water: "Moderate · 500–700 mm", image: "/images/crop-detail.jpg", explanation: "Illustrative option with moderate water needs. The score is a mock ranking, not a yield or profitability forecast." },
  { id: "millet", name: "Pearl millet", score: 78, season: "Kharif · Jun–Sep", soil: ["Sandy", "Red", "Desert / arid"], water: "Low · 350–500 mm", image: "/images/farm-field.jpg", explanation: "Demonstration alternative for lower water availability. Verify variety and regional suitability before planting." },
];
export const pestReports: PestReport[] = [
  { id: "p-1", crop: "Tomato", label: "Leaf spot pattern", confidence: "Uncertain · demo label", date: "Oct 27, 2026", status: "Demonstration" },
  { id: "p-2", crop: "Rice", label: "No image analyzed", confidence: "Unavailable", date: "Oct 21, 2026", status: "Demonstration" },
];
export const activities: Activity[] = [
  { id: "a-1", title: "Crop options explored", detail: "Greenfield Farm · Kharif", date: "Today", icon: "crop" },
  { id: "a-2", title: "Irrigation plan calculated", detail: "Mango Grove · Drip", date: "Yesterday", icon: "water" },
  { id: "a-3", title: "Pest image demonstration", detail: "Tomato · Unverified mock result", date: "Oct 27", icon: "pest" },
];
export const weather = { location: "Guntur, Andhra Pradesh", temperature: 29, humidity: 68, rainfall: 4.2, updated: "Demonstration · 8:30 AM" };
export const weeklyWater = [{ day: "Mon", liters: 7800 }, { day: "Tue", liters: 6200 }, { day: "Wed", liters: 8900 }, { day: "Thu", liters: 7100 }, { day: "Fri", liters: 5400 }, { day: "Sat", liters: 8200 }, { day: "Sun", liters: 6500 }];
export const weatherTrend = [{ day: "Mon", temp: 31, rain: 1 }, { day: "Tue", temp: 30, rain: 0 }, { day: "Wed", temp: 32, rain: 4 }, { day: "Thu", temp: 29, rain: 6 }, { day: "Fri", temp: 30, rain: 2 }, { day: "Sat", temp: 31, rain: 0 }, { day: "Sun", temp: 29, rain: 3 }];
export const fertilizerProducts = [{ name: "Demo NPK 10-10-10", n: 10, p: 10, k: 10 }, { name: "Demo urea", n: 46, p: 0, k: 0 }, { name: "Custom product", n: 0, p: 0, k: 0 }];
