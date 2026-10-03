# Supabase setup (all free tier)

1. Create project at https://supabase.com/dashboard (free).
2. SQL Editor > run `migrations/0001_init.sql`.
3. Storage > create private buckets: `photos`, `voice-notes`.
4. Project Settings > API > copy URL + anon key into:
   - `.env` (root, for reference)
   - `apps/mobile/.env` as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Auth > enable Email (magic link) for MVP — $0, no SMS cost.

Later: add RLS-tested Edge Function `generate-story` that calls your finetuned model
so the Gemini key never ships inside the app.
