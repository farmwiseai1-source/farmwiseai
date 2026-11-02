# Supabase migrations

Apply the versioned migration with the Supabase CLI from the repository root:

```powershell
supabase link --project-ref <project-ref>
supabase db push
supabase db reset
```

`db reset` is for an isolated local/test database only. It applies the migration and then [seed.sql](../seed.sql). Never run destructive reset commands against production.

The migration creates user-owned tables, ownership-based RLS policies, the private `crop-images` storage bucket, and the auth profile trigger.
