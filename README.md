# SOS — Sales Operating System

> The system runs the process. You run the conversations.

A premium, dark-themed **Power Dialer Arena**: an assisted (progressive)
power dialer that calls your phone once, then dials prospects one at a
time, bridges you live, and only asks for input when a real conversation
happens. Built with Next.js, Prisma/Postgres, and Twilio Voice.

This first pass focuses on the dialer arena end-to-end: the live call
state display, scoreboard, current-prospect card, always-open notes panel,
disposition buttons, and activity feed. CRM/analytics/mapping screens
described in the full product vision are not built yet.

## How the dialer works

1. Click **START GAME** — the server calls *your* phone via Twilio.
2. When you answer, the system immediately starts dialing the first
   prospect in the queue and bridges the call live to your phone.
3. **Busy / failed / no answer** → the system automatically advances to
   the next prospect. You never touch anything.
4. **A human (or voicemail) answers** → you're connected live. Type notes
   as you talk (autosaved), then pick a disposition — the system
   immediately dials the next prospect on your existing phone line.

This is implemented with a single standing call to your phone: each
"next dial" is a live Twilio `<Dial>` from that call, and disposition
submission uses the Twilio REST API to redirect your live call to the
next prospect — no re-dialing your phone between prospects.

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (or any reachable Postgres instance)
- A Twilio account with:
  - Account SID + Auth Token
  - A Twilio phone number capable of outbound voice
- A publicly reachable URL for local development (e.g. an
  [ngrok](https://ngrok.com) tunnel) — Twilio must be able to reach your
  webhooks.

## Setup

```bash
npm install

# Point DATABASE_URL at your Postgres instance, then:
npx prisma migrate dev
npx prisma db seed
```

Copy `.env.example` to `.env` (or edit the existing `.env`) and fill in:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sos_dev?schema=public"

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567   # your Twilio number
REP_PHONE_NUMBER=+15557654321      # default number to call when starting a session

# Must be a URL Twilio can reach — e.g. your ngrok tunnel in dev, or your
# deployed URL in production.
PUBLIC_BASE_URL=https://your-ngrok-subdomain.ngrok-free.app
```

### Local development with real calls

Twilio needs to reach your webhooks over the public internet, so run a
tunnel alongside the dev server:

```bash
ngrok http 3000
```

Set `PUBLIC_BASE_URL` in `.env` to the `https://...ngrok-free.app` URL ngrok
gives you, then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter your phone
number (or leave it blank to use `REP_PHONE_NUMBER`), and press **START
GAME**.

Without Twilio credentials configured, the UI still runs and the API
returns a clear error rather than crashing — useful for working on the
interface without a Twilio account connected.

## Project structure

- `src/app/page.tsx` — the Dialer Arena (start screen → live session →
  game-over screen)
- `src/components/dialer/*` — Scoreboard, ProspectCard, NotesPanel,
  DispositionButtons, ActivityFeed, etc.
- `src/app/api/session/*` — start/end a dial session, poll live state
- `src/app/api/twilio/*` — TwiML and status-callback webhooks Twilio calls
  during a session
- `src/app/api/dispositions` — save a disposition + notes and trigger the
  next dial
- `src/lib/dialer.ts` — queue logic, activity logging, session snapshot
- `src/lib/twilio.ts` — Twilio client + webhook signature verification
- `prisma/schema.prisma` — data model (prospects, dial sessions, calls,
  notes, timeline events)
- `prisma/seed.ts` — sample prospects to dial against

## Notes on the call-state model

Every dialed call moves through `CallState` values (`DIALING_PROSPECT`,
`RINGING_PROSPECT`, `CONNECTED`, `BUSY`, `FAILED`, `NO_ANSWER`,
`VOICEMAIL`, `COMPLETED`, ...) driven by Twilio status callbacks and
Answering Machine Detection. Disposition buttons only unlock once a call
is actually answered — busy/failed/no-answer calls skip straight to the
next dial with no action required from you. If Twilio detects a
voicemail greeting, the call is **not** auto-skipped — you stay live on
the line and can choose to leave a message before disposing the call as
Voicemail.
