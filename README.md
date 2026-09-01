# RandomConnect — MERN + WebRTC random video chat

A production-shaped starting point for an Omegle/Chatroulette-style random
video chat app: React + Tailwind frontend, Node/Express + Socket.io signaling
backend, MongoDB for reports/bans, peer-to-peer WebRTC for the actual video.

## Why this isn't "just" a coding exercise

Omegle shut down in November 2023 after lawsuits alleging the platform
exposed minors to sexual predators and explicit content. Any random-stranger
video chat product carries that same structural risk: it pairs anonymous
strangers, including minors who lie about their age, in unmoderated 1:1 video.
That risk doesn't go away because the code is well-written — it has to be
designed against, from the ground up. This scaffold treats trust & safety as
core architecture, not a feature you bolt on before launch:

- `backend/src/services/moderation.js` is the trust & safety module. **It is
  currently a stub** — `moderateFrame()` always passes. Do not launch
  publicly without wiring in a real provider.
- Recommended providers: **Hive Moderation** or **Amazon Rekognition Content
  Moderation** for real-time nudity/sexual-content detection on sampled video
  frames; **Microsoft PhotoDNA** for CSAM hash-matching (enrollment is a
  formal application process with Microsoft/NCMEC, not just an API key).
- **Legal reporting obligation (US)**: if you operate in or serve users in
  the US, suspected CSAM must be reported to NCMEC's CyberTipline
  (https://report.cybertip.org) under 18 U.S.C. § 2258A. This is a legal
  requirement, not a design choice, and it applies regardless of company
  size.
- The age gate in `Landing.jsx` is a self-certification checkbox. That is the
  legal minimum in some jurisdictions but is trivially bypassed — treat it as
  one layer, not a solution. Consider stronger measures (device-level age
  signals, ID verification for certain jurisdictions, model-based age
  estimation from video) proportionate to your risk tolerance and target
  markets.
- Reports are prioritized by severity, but "prioritized in a database" isn't
  the same as "reviewed by a human fast." Before launch, put a real on-call
  moderation process behind `autoBanOnRepeatedReports` and the `/admin/reports`
  endpoint — critical reports should reach a human within minutes.

If you're building this for a real audience, budget for a moderation
pipeline and legal review before budgeting for UI polish.

## Architecture

```
┌─────────────┐        Socket.io (signaling, chat, reports)      ┌─────────────┐
│   Browser   │◄───────────────────────────────────────────────►│    Server   │
│  (React)    │                                                   │ (Express +  │
│             │        WebRTC (peer-to-peer audio/video)          │  Socket.io) │
│  Peer A     │◄─────────────────────────────────────────────────►             │
└─────────────┘                                                   │             │
      ▲                                                           │  MongoDB    │
      │        WebRTC (peer-to-peer, direct or via TURN)          │  (reports,  │
      ▼                                                           │   bans)     │
┌─────────────┐                                                   └─────────────┘
│   Browser   │
│  Peer B     │
└─────────────┘
```

Video/audio never touches the server — it flows peer-to-peer (or via a TURN
relay when direct connection isn't possible). The server only handles
matchmaking, WebRTC handshake relay, text chat, and moderation/reporting.

## Getting started

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, TURN credentials, moderation API key
npm install
npm run dev             # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

You'll need MongoDB running locally (or a connection string to Atlas) and,
for reliable connections across real-world networks, a TURN server — see the
comment in `backend/.env.example` and `frontend/src/hooks/useWebRTC.js`.

## What's implemented

**1-to-1 random chat**
- Interest-based matchmaking queue with FIFO fallback
- WebRTC signaling relay (offer/answer/ICE) over Socket.io
- Peer-to-peer video + audio, mic/camera toggle, skip/next, stop
- In-session text chat with typing indicator

**Group rooms** (`/rooms`)
- Anyone can create a room (name, topic, voice or video, 2–12 people) —
  no auth, no approval, live the moment it's created
- Browsable room list, sorted by who's actually live right now, with
  presence-aware "live · N people" / "empty — be first in" states
- Full-mesh WebRTC: every participant connects directly to every other
  participant (`useGroupWebRTC.js` on the client, `groupRooms.js` on the
  server) — no extra media infra needed up to the room's capped size
- Room-wide text chat, and per-participant reporting from inside a live call
- Room creator + promoted moderators can mute, hold (waiting room), or
  remove disruptive participants — see "Moderators & handling spam" below
- Room metadata persists in MongoDB (`Room.js`); who's actually present is
  tracked in-memory (`roomState.js`) since presence changes far faster than
  you'd want to round-trip through a database

**Trust & safety (applies to both 1-to-1 and group rooms)**
- Reporting flow that ends the session/removes the reported participant and
  auto-bans on repeated critical reports within 24h
- Device-fingerprint + IP-hash ban enforcement checked before matchmaking
  and before joining a room
- Rate limiting and payload size caps on the signaling socket

**UI**
- A distinctive UI: deep indigo base, cyan/violet "signal" accent palette,
  animated pulse-connector as the page's signature motif, Space Grotesk +
  Inter + JetBrains Mono type system

### A note on group room scale

Full mesh is the simplest way to get group calls working with zero extra
infrastructure, but bandwidth and CPU cost grow roughly with the square of
participant count — each client uploads its stream once per other
participant. That's why room size is capped at 12 in `Room.js`. If you want
larger rooms, the next step is an SFU (LiveKit, mediasoup, or Janus) so each
client uploads once and the server fans it out — that's a real infrastructure
addition, not a config flag, so budget for it if "more people per room" turns
out to be a priority.

## Moderators & handling spam

- **Who becomes a moderator**: the person who creates a room is always its
  moderator. They can promote any other current participant to moderator
  from the "Host ⋯" menu on that person's tile — no separate signup or
  approval flow, it's a live, in-room action.
- **What a moderator can do to a disruptive participant**, from their tile:
  - **Mute** — enforced two ways at once: the target's own client is told to
    disable its mic, *and* every other participant's client is told to
    locally stop playing audio received from that person. Even if someone
    ran a modified client that ignored the mute request, everyone else still
    can't hear them — enforcement doesn't rely on their cooperation.
  - **Waiting room** — pulls the person out of the live call immediately
    (their connections to everyone close); they see a "you're in the waiting
    room" screen. A moderator can admit them back in or leave them there
    from the waiting-room panel (visible only to moderators).
  - **Remove** — kicks them and blocks them from rejoining that specific room
    for as long as it stays live continuously (this resets once the room
    empties out completely — it's a room-level control, not a platform ban).
- This is separate from the global ban system in `moderation.js`, which
  triggers automatically after repeated critical reports and blocks a device
  from the whole platform. Room-level moderation is a lighter, faster tool
  for keeping one room usable day to day.
- **Known limitation**: role hierarchy is flat — any moderator can act on any
  non-moderator, and moderators can't demote each other yet. If you need
  finer-grained roles (e.g. only the creator can remove other moderators),
  that's a small addition to `isModeratorOfRoom` and the `group:mod-*`
  handlers in `groupRooms.js`.

## Camera behavior

Camera starts **off** everywhere — the 1-to-1 call and every group room,
regardless of whether the room is set to "video" mode. Only the microphone
is requested on join. The user has to explicitly tap "turn camera on," which
requests the video track and adds it to the existing call via WebRTC
renegotiation — no reconnect, no dropped audio, no interruption to anyone
already in the call. Applies to both `ChatRoom.jsx` and `GroupRoom.jsx`.

## Pre-deployment checklist

- [ ] Real content-moderation provider wired into `moderateFrame()` (Hive /
      AWS Rekognition / PhotoDNA for CSAM hashing)
- [ ] TURN server configured (both `.env` files have placeholders)
- [ ] Real auth in front of `/api/admin/*`
- [ ] Matchmaking queue and room presence moved to Redis if running more than
      one server process
- [ ] Legal review: ToS, privacy policy, age-verification approach, and a
      documented CSAM-reporting process (NCMEC CyberTipline, US)
- [ ] A staffed moderation process behind the report queue — a database table
      isn't a review process by itself
- [ ] Load-test full-mesh group rooms at your intended max room size before
      committing to it publicly — mesh cost is per-participant-squared
