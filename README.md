# Video call (Next.js + TypeScript + Supabase Realtime)

1:1 video calls using WebRTC. Supabase Realtime Broadcast handles signaling, so no tables or edge functions are needed.

## Run it
```bash
npm install
cp .env.local.example .env.local   # add your Supabase URL and anon key (Project Settings → API)
npm run dev
```
Open http://localhost:3000, click **Start a meeting**, then open the invite link in a second tab or on another device.

## Structure
- `app/page.tsx` – start or join a meeting
- `app/room/[id]/page.tsx` – call screen (video, mute, camera, leave)
- `hooks/useVideoCall.ts` – WebRTC + Supabase signaling
- `lib/supabase.ts` – Supabase client (reads env vars)

## Notes
- Camera access needs `localhost` or HTTPS.
- Only STUN is configured. Strict NATs may need a TURN server; add it to `RTC_CONFIG` in `hooks/useVideoCall.ts`.
- The Supabase project must be active (not paused).
