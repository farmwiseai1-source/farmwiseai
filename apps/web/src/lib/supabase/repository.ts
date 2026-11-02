import type { Farm } from "@/lib/farmwise-types";
import type { DemoHistoryEntry } from "@/lib/demo-repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "./config";

type FarmRow = {
  id: string;
  name: string;
  location_name: string;
  soil_type: string;
  area_value: number;
  area_unit: string;
  irrigation_method: string;
};

function clientOrThrow() {
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  return client as unknown as SupabaseClient;
}

function toFarm(row: FarmRow): Farm {
  return {
    id: row.id,
    name: row.name,
    location: row.location_name,
    area: row.area_value,
    unit: row.area_unit === "hectares" ? "hectares" : "acres",
    soil: row.soil_type as Farm["soil"],
    crop: "Not decided",
    irrigation: row.irrigation_method,
  };
}

export async function getCurrentUser() {
  const { data, error } = await clientOrThrow().auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function listUserFarms() {
  const client = clientOrThrow();
  const { data, error } = await client.from("farms").select("id,name,location_name,soil_type,area_value,area_unit,irrigation_method").order("created_at", { ascending: true });
  if (error) throw error;
  return (data as FarmRow[]).map(toFarm);
}

export async function createUserFarm(input: Omit<Farm, "id"> & { waterAvailability?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in to create a farm.");
  const { data, error } = await clientOrThrow().from("farms").insert({
    owner_id: user.id,
    name: input.name,
    location_name: input.location,
    latitude: null,
    longitude: null,
    soil_type: input.soil,
    area_value: input.area,
    area_unit: input.unit,
    irrigation_method: input.irrigation,
    water_availability: input.waterAvailability ?? "Not sure",
  }).select("id,name,location_name,soil_type,area_value,area_unit,irrigation_method").single();
  if (error) throw error;
  return toFarm(data as FarmRow);
}

export async function updateUserFarm(id: string, input: Omit<Farm, "id"> & { waterAvailability?: string }) {
  const { data, error } = await clientOrThrow().from("farms").update({
    name: input.name,
    location_name: input.location,
    soil_type: input.soil,
    area_value: input.area,
    area_unit: input.unit,
    irrigation_method: input.irrigation,
    water_availability: input.waterAvailability ?? "Not sure",
  }).eq("id", id).select("id,name,location_name,soil_type,area_value,area_unit,irrigation_method").single();
  if (error) throw error;
  return toFarm(data as FarmRow);
}

export async function saveOnboarding(input: { fullName: string; preferredLanguage: string; farm: Omit<Farm, "id"> & { latitude?: number | null; longitude?: number | null }; waterAvailability: string; crop: string }) {
  const client = clientOrThrow();
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in to complete onboarding.");
  const { error: profileError } = await client.from("profiles").upsert({ id: user.id, full_name: input.fullName, preferred_language: input.preferredLanguage, onboarding_completed: false }, { onConflict: "id" });
  if (profileError) throw profileError;
  const { error: farmError } = await client.from("farms").insert({ owner_id: user.id, name: input.farm.name, location_name: input.farm.location, latitude: input.farm.latitude ?? null, longitude: input.farm.longitude ?? null, soil_type: input.farm.soil, area_value: input.farm.area, area_unit: input.farm.unit, irrigation_method: input.farm.irrigation, water_availability: input.waterAvailability });
  if (farmError) throw farmError;
  const { error: completeError } = await client.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  if (completeError) throw completeError;
}

async function firstOwnedFarmId() {
  const farms = await listUserFarms();
  if (!farms[0]) throw new Error("Create a farm before saving a record.");
  return farms[0].id;
}

export async function saveIrrigationLog(input: { snapshot: Record<string, unknown>; litres: number; minutes: number }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  const { error } = await clientOrThrow().from("irrigation_logs").insert({ owner_id: user.id, farm_id: await firstOwnedFarmId(), field_id: null, input_snapshot: input.snapshot, estimated_water_litres: input.litres, estimated_runtime_minutes: input.minutes, actual_water_litres: null, notes: null });
  if (error) throw error;
}

export async function saveFertilizerLog(input: { snapshot: Record<string, unknown>; cropType: string; area: number; productQuantity: number; nutrientRequirement: Record<string, unknown>; composition: Record<string, unknown> }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  const { error } = await clientOrThrow().from("fertilizer_logs").insert({ owner_id: user.id, farm_id: await firstOwnedFarmId(), field_id: null, crop_type: input.cropType, area_value: input.area, area_unit: "acres", nutrient_requirement: input.nutrientRequirement, nutrient_composition_percent: input.composition, product_quantity: input.productQuantity, input_snapshot: input.snapshot });
  if (error) throw error;
}

export async function saveCropRecommendation(input: { snapshot: Record<string, unknown>; results: unknown }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  const { error } = await clientOrThrow().from("crop_recommendations").insert({ owner_id: user.id, farm_id: await firstOwnedFarmId(), field_id: null, input_snapshot: input.snapshot, results: input.results, engine_version: "demonstration-v1", data_source_metadata: { status: "demonstration", verified: false } });
  if (error) throw error;
}

export async function savePestReport(input: { file: File; cropType: string }) {
  const client = clientOrThrow(); const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  const path = `${user.id}/${crypto.randomUUID()}-${input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const upload = await client.storage.from("crop-images").upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (upload.error) throw upload.error;
  const { error } = await client.from("pest_reports").insert({ owner_id: user.id, farm_id: await firstOwnedFarmId(), field_id: null, crop_type: input.cropType, storage_path: path, analysis_status: "pending", result_payload: { status: "demonstration", verified: false }, model_version: null });
  if (error) { await client.storage.from("crop-images").remove([path]); throw error; }
}

export async function saveAdvisorMessage(input: { conversationId?: string; language: string; role: "farmer" | "advisor"; content: string }) {
  const client = clientOrThrow(); const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  let conversationId = input.conversationId;
  if (!conversationId) { const created = await client.from("advisor_conversations").insert({ owner_id: user.id, farm_id: await firstOwnedFarmId(), selected_language: input.language, metadata: { status: "demonstration" } }).select("id").single(); if (created.error) throw created.error; conversationId = created.data.id; }
  const { error } = await client.from("advisor_messages").insert({ conversation_id: conversationId, owner_id: user.id, role: input.role, content: input.content, metadata: { status: "demonstration" } });
  if (error) throw error;
  return conversationId;
}

export async function listUserHistory(): Promise<DemoHistoryEntry[]> {
  const client = clientOrThrow();
  const [recommendations, pestReports, irrigation, fertilizer] = await Promise.all([
    client.from("crop_recommendations").select("id,created_at,results").order("created_at", { ascending: false }).limit(25),
    client.from("pest_reports").select("id,created_at,crop_type,analysis_status").order("created_at", { ascending: false }).limit(25),
    client.from("irrigation_logs").select("id,created_at,estimated_water_litres,estimated_runtime_minutes").order("created_at", { ascending: false }).limit(25),
    client.from("fertilizer_logs").select("id,created_at,product_quantity,crop_type").order("created_at", { ascending: false }).limit(25),
  ]);
  for (const result of [recommendations, pestReports, irrigation, fertilizer]) if (result.error) throw result.error;
  const rows = [
    ...(recommendations.data ?? []).map((row: { id: string; created_at: string }) => ({ id: row.id, type: "Crop recommendation", title: "Crop options saved", detail: "Demonstration ranking · not validated advice", date: new Date(row.created_at).toLocaleDateString() })),
    ...(pestReports.data ?? []).map((row: { id: string; created_at: string; crop_type: string; analysis_status: string }) => ({ id: row.id, type: "Pest report", title: "Crop image report saved", detail: `${row.crop_type} · ${row.analysis_status}`, date: new Date(row.created_at).toLocaleDateString() })),
    ...(irrigation.data ?? []).map((row: { id: string; created_at: string; estimated_water_litres: number; estimated_runtime_minutes: number }) => ({ id: row.id, type: "Irrigation", title: "Irrigation estimate saved", detail: `${Math.round(row.estimated_water_litres).toLocaleString()} L · ${Math.round(row.estimated_runtime_minutes)} min`, date: new Date(row.created_at).toLocaleDateString() })),
    ...(fertilizer.data ?? []).map((row: { id: string; created_at: string; product_quantity: number; crop_type: string }) => ({ id: row.id, type: "Fertilizer", title: "Fertilizer calculation saved", detail: `${row.product_quantity} kg · ${row.crop_type}`, date: new Date(row.created_at).toLocaleDateString() })),
  ];
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getUserProfile() {
  const client = clientOrThrow(); const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  const { data, error } = await client.from("profiles").select("full_name,preferred_language,onboarding_completed").eq("id", user.id).single();
  if (error) throw error;
  return { email: user.email ?? "", ...(data as { full_name: string | null; preferred_language: string; onboarding_completed: boolean }) };
}

export async function updateUserProfile(input: { fullName: string; preferredLanguage: string }) {
  const client = clientOrThrow(); const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  const { error } = await client.from("profiles").update({ full_name: input.fullName.trim(), preferred_language: input.preferredLanguage }).eq("id", user.id);
  if (error) throw error;
}

export async function listUserNotifications() {
  const client = clientOrThrow();
  const { data, error } = await client.from("notifications").select("id,title,message,category,read_at,created_at").order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return data as Array<{ id: string; title: string; message: string; category: string; read_at: string | null; created_at: string }>;
}

export async function markNotificationRead(id: string) {
  const { error } = await clientOrThrow().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
