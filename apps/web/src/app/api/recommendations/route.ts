import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluateCrops, cropInputSchema } from "@/lib/crop-engine";
import { fetchNormalizedWeather } from "@/lib/weather";

export async function POST(request: Request) {
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const userResult = await client.auth.getUser();
  if (userResult.error || !userResult.data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { farmId?: string; soilType?: string; season?: string; waterAvailability?: string } | null;
  if (!body?.farmId) return NextResponse.json({ error: "A farm is required." }, { status: 400 });
  const farmResult = await client.from("farms").select("id,latitude,longitude,soil_type,water_availability").eq("id", body.farmId).eq("owner_id", userResult.data.user.id).single();
  if (farmResult.error || !farmResult.data) return NextResponse.json({ error: "Farm not found." }, { status: 404 });
  let weather: Awaited<ReturnType<typeof fetchNormalizedWeather>> | null = null;
  if (farmResult.data.latitude !== null && farmResult.data.longitude !== null) { try { weather = await fetchNormalizedWeather(farmResult.data.latitude, farmResult.data.longitude); } catch { weather = null; } }
  const inputResult = cropInputSchema.safeParse({ soilType: body.soilType || farmResult.data.soil_type, season: body.season || "Kharif · Monsoon", waterAvailability: body.waterAvailability || farmResult.data.water_availability, temperatureC: weather?.current.temperatureC ?? null, rainfallMm: weather?.forecast.slice(0, 7).reduce((sum, day) => sum + day.precipitationMm, 0) ?? null });
  if (!inputResult.success) return NextResponse.json({ error: "Farm recommendation inputs are incomplete or invalid.", details: inputResult.error.flatten().fieldErrors }, { status: 400 });
  const input = inputResult.data;
  const catalogResult = await client.from("crop_catalog").select("id,name,rule_data,source_reference").order("name");
  if (catalogResult.error) return NextResponse.json({ error: "Crop catalog is unavailable." }, { status: 503 });
  const recommendations = evaluateCrops((catalogResult.data ?? []) as Array<{ id: string; name: string; rule_data: import("@/lib/crop-engine").CropRule; source_reference: string }>, input);
  const snapshot = { ...input, weatherSource: weather?.source ?? null, weatherObservedAt: weather?.current.observedAt ?? null };
  const persisted = await client.from("crop_recommendations").insert({ owner_id: userResult.data.user.id, farm_id: body.farmId, field_id: null, input_snapshot: snapshot, results: recommendations, engine_version: "phase4-rules-v1", data_source_metadata: { catalog: "Supabase crop_catalog", weather: weather?.source ?? "unavailable", verified: false } }).select("id").single();
  if (persisted.error) return NextResponse.json({ error: "Recommendation could not be saved." }, { status: 500 });
  return NextResponse.json({ id: persisted.data.id, recommendations, weather, warnings: weather ? [] : ["Weather was unavailable or no coordinates were saved; rainfall and temperature were not used."] });
}
