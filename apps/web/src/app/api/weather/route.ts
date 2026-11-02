import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchNormalizedWeather, weatherQuerySchema } from "@/lib/weather";

export async function GET(request: Request) {
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const userResult = await client.auth.getUser();
  if (userResult.error || !userResult.data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const farmId = new URL(request.url).searchParams.get("farmId");
  if (!farmId) return NextResponse.json({ error: "A farm is required." }, { status: 400 });
  const farmResult = await client.from("farms").select("id,latitude,longitude").eq("id", farmId).eq("owner_id", userResult.data.user.id).single();
  if (farmResult.error || !farmResult.data) return NextResponse.json({ error: "Farm not found." }, { status: 404 });
  if (farmResult.data.latitude === null || farmResult.data.longitude === null) return NextResponse.json({ error: "Add farm coordinates to use live weather." }, { status: 422 });
  const coordinates = weatherQuerySchema.safeParse({ latitude: farmResult.data.latitude, longitude: farmResult.data.longitude });
  if (!coordinates.success) return NextResponse.json({ error: "Farm coordinates are invalid." }, { status: 422 });
  try {
    const weather = await fetchNormalizedWeather(coordinates.data.latitude, coordinates.data.longitude);
    await client.from("weather_snapshots").insert({ farm_id: farmId, owner_id: userResult.data.user.id, source: weather.source, observed_at: weather.current.observedAt, payload: weather });
    return NextResponse.json(weather);
  } catch (error) {
    console.error("weather_provider_error", error instanceof Error ? error.message : "unknown");
    const cached = await client.from("weather_snapshots").select("payload,observed_at,source").eq("farm_id", farmId).eq("owner_id", userResult.data.user.id).order("observed_at", { ascending: false }).limit(1).maybeSingle();
    if (cached.data?.payload) return NextResponse.json({ ...(cached.data.payload as object), stale: true, source: cached.data.source, cachedAt: cached.data.observed_at }, { headers: { "x-weather-stale": "true" } });
    return NextResponse.json({ error: "Live weather is temporarily unavailable." }, { status: 502 });
  }
}
