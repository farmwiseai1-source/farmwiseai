export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; full_name: string | null; preferred_language: string; onboarding_completed: boolean; created_at: string; updated_at: string }; Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & { created_at?: string; updated_at?: string }; Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]> };
      farms: { Row: { id: string; owner_id: string; name: string; location_name: string; latitude: number | null; longitude: number | null; soil_type: string; area_value: number; area_unit: string; irrigation_method: string; water_availability: string; created_at: string; updated_at: string }; Insert: Omit<Database["public"]["Tables"]["farms"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<Database["public"]["Tables"]["farms"]["Insert"]> };
      farm_fields: { Row: { id: string; farm_id: string; owner_id: string; name: string; soil_type: string; area_value: number; area_unit: string; crop_type: string | null; irrigation_method: string; created_at: string; updated_at: string }; Insert: Omit<Database["public"]["Tables"]["farm_fields"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<Database["public"]["Tables"]["farm_fields"]["Insert"]> };
      crop_catalog: { Row: { id: string; name: string; scientific_name: string | null; supported_seasons: Json; suitable_soil_types: Json; image_reference: string | null; description: string; source_reference: string; rule_data: Json; created_at: string }; Insert: Omit<Database["public"]["Tables"]["crop_catalog"]["Row"], "created_at"> & { created_at?: string }; Update: Partial<Database["public"]["Tables"]["crop_catalog"]["Insert"]> };
      crop_recommendations: { Row: { id: string; owner_id: string; farm_id: string; field_id: string | null; input_snapshot: Json; results: Json; engine_version: string; data_source_metadata: Json; created_at: string }; Insert: Omit<Database["public"]["Tables"]["crop_recommendations"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Database["public"]["Tables"]["crop_recommendations"]["Insert"]> };
      irrigation_logs: { Row: { id: string; owner_id: string; farm_id: string; field_id: string | null; input_snapshot: Json; estimated_water_litres: number; estimated_runtime_minutes: number; actual_water_litres: number | null; notes: string | null; created_at: string }; Insert: Omit<Database["public"]["Tables"]["irrigation_logs"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Database["public"]["Tables"]["irrigation_logs"]["Insert"]> };
      fertilizer_logs: { Row: { id: string; owner_id: string; farm_id: string; field_id: string | null; crop_type: string; area_value: number; area_unit: string; nutrient_requirement: Json; nutrient_composition_percent: Json; product_quantity: number; input_snapshot: Json; created_at: string }; Insert: Omit<Database["public"]["Tables"]["fertilizer_logs"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Database["public"]["Tables"]["fertilizer_logs"]["Insert"]> };
      notifications: { Row: { id: string; owner_id: string; title: string; message: string; category: string; read_at: string | null; created_at: string }; Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
