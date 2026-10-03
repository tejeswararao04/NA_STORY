# NA Story — API contract (frozen for MVP)

Mobile never calls Gemini directly in production. It calls ONE endpoint shape:

## Generate story
`POST {AI_URL}/generate`
```json
{ "name": "Tejas", "prompt": "a talking river" }
```
->
```json
{ "story": "...", "source": "mock | gemini-direct | finetuned" }
```

Today `AI_URL` = `services/ai` (mock or Gemini free key).
Later `AI_URL` = same path backed by your finetuned model. App code unchanged.

## Data (Supabase)
- `profiles(id, display_name)`
- `stories(id, user_id, title, prompt, story_text, photo_url, voice_url, source)`
- Storage buckets: `photos`, `voice-notes` (private, per-user via RLS)
