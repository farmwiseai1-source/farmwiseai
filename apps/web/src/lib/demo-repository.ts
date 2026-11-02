import { activities, farms, type Farm } from "./farmwise-types";

export type DemoHistoryEntry = { id: string; type: string; title: string; detail: string; date: string };

const sessionFarms: Farm[] = [...farms];
const sessionHistory: DemoHistoryEntry[] = activities.map((item) => ({
  id: item.id,
  type: item.icon === "crop" ? "Crop recommendation" : item.icon === "water" ? "Irrigation" : item.icon === "fertilizer" ? "Fertilizer" : "Pest report",
  title: item.title,
  detail: item.detail,
  date: item.date,
}));
sessionHistory.push({ id: "fertilizer-example", type: "Fertilizer", title: "Product quantity example", detail: "Greenfield Farm · user input not verified", date: "Oct 24, 2026" });

export function listDemoFarms() { return [...sessionFarms]; }
export function addDemoFarm(farm: Omit<Farm, "id">) {
  const saved = { ...farm, id: `farm-${Date.now()}` };
  sessionFarms.push(saved);
  return saved;
}
export function updateDemoFarm(id: string, updates: Omit<Farm, "id">) {
  const index = sessionFarms.findIndex((farm) => farm.id === id);
  if (index < 0) return false;
  sessionFarms[index] = { ...sessionFarms[index], ...updates };
  return true;
}
export function recordDemoHistory(entry: Omit<DemoHistoryEntry, "id" | "date">) {
  sessionHistory.unshift({ ...entry, id: `history-${Date.now()}`, date: "Just now" });
}
export function listDemoHistory() { return [...sessionHistory]; }
