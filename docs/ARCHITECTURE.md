# Architecture

A lightweight browser MMO foundation — a modern spiritual successor to early RuneScape, designed for Chromebooks, tablets, and casual players.

## Design Goals

| Principle | What it means in code |
|-----------|----------------------|
| **Accessibility first** | Low GPU usage, baked static maps, dirty-checked rendering, device-aware FPS/zoom |
| **Instant play** | Small bundle, no install, procedural boot textures, Vite dev/build |
| **Persistent world** | Single continuous tile map (not levels), serializable world snapshots |
| **Mobile-friendly** | Touch-first input priority, safe-area insets, large joystick, adaptive HUD |
| **Progression-ready** | ECS-lite entities, event bus, system pipeline, input intents for networking |

---

## Folder Structure

```
src/
├── main.ts                    Entry point — detects device profile, starts Phaser
├── assets/                    Future sprite sheets, audio, data files
├── ui/                        Phaser-specific presentation (HUD, input widgets)
│   ├── Hud.ts
│   ├── KeyboardInput.ts       Implements InputProvider
│   └── TouchControls.ts       Implements InputProvider
└── game/
    ├── Game.ts                Phaser bootstrap with performance settings
    ├── constants.ts           Shared tuning values
    ├── core/                  Cross-cutting infrastructure
    │   ├── EventBus.ts        Decoupled pub/sub for systems and UI
    │   ├── GameContext.ts     Shared runtime state and snapshot API
    │   └── WorldSnapshot.ts   Serializable world state shape
    ├── platform/
    │   └── DeviceProfile.ts   Detects input mode, low-end hardware, safe areas
    ├── input/                 Input logic (engine-agnostic)
    │   ├── types.ts           InputState, InputIntent, pointer/select actions
    │   ├── InputProvider.ts   Interface for keyboard/touch/gamepad
    │   └── InputManager.ts    Merges providers by priority
    ├── interaction/           World object interaction (tile-based)
    │   ├── types.ts           Actions, targets, labels
    │   ├── InteractableRegistry.ts  Maps tiles → interactable objects
    │   ├── InteractionState.ts      Selection, approach, messages
    │   └── interactionUtils.ts      Range checks, approach tile finding
    ├── components/            ECS data definitions and factories
    ├── entities/              Entity registry and spawn helpers
    ├── state/
    │   └── GameState.ts       Tick counter + player entity reference
    ├── systems/               Game logic and render sync (ordered pipeline)
    │   ├── SystemPipeline.ts  Runs systems in sequence
    │   ├── InputSystem.ts     Applies input → velocity (+ auto-approach)
    │   ├── InteractionSystem.ts  Select, hover, examine, chop/mine stubs
    │   ├── RenderSystem.ts    Syncs ECS positions → Phaser sprites
    │   ├── CameraSystem.ts    Follows player with device-aware zoom
    │   └── GameWorld.ts       Orchestrates context + pipeline
    ├── scenes/                Phaser lifecycle
    │   ├── BootScene.ts       Generates lightweight tile textures
    │   └── GameScene.ts       Wires context, input, HUD, update loop
    └── world/                 Map data, collision, static rendering
        ├── TileTypes.ts
        ├── WorldMap.ts
        ├── WorldRenderer.ts   Bakes tiles into RenderTextures (2 draw calls)
        └── mapData.ts
```

---

## Runtime Flow

```
main.ts
  └─ createDeviceProfile()     Detect touch/keyboard, low-end, safe areas
  └─ createGame()              Phaser with performance config

BootScene
  └─ Generate canvas tile textures (no external downloads)
  └─ Start GameScene

GameScene (each frame)
  └─ InputManager.poll()       Touch (priority 100) → keyboard (50)
  └─ GameWorld.update()
       ├─ InputSystem          input → player velocity
       ├─ MovementSystem       velocity → position + collision + events
       ├─ RenderSystem         position → sprite (dirty-checked)
       └─ CameraSystem         center on player
  └─ Hud.update()              Read position from GameContext (single source)
```

---

## Key Architectural Decisions

### 1. ECS-lite (Entity Component System)

Entities are IDs with attached **data components** (`position`, `velocity`, `collidable`, `renderable`, `player`). **Systems** operate on queries (`entityManager.query('position', 'velocity')`).

**Why:** NPCs, dropped items, other players, and projectiles all become entities with different component sets. Systems stay small and composable.

### 2. Single Source of Truth

Player position lives in the **ECS `position` component** only. `GameState` stores the player entity ID and tick — not a duplicate copy of coordinates. `GameContext.getPlayerPosition()` and `createSnapshot()` derive state from ECS when needed.

**Why:** Avoids drift between render state, UI, and future server reconciliation.

### 3. Logic / Rendering Separation

| Layer | Responsibility |
|-------|----------------|
| `game/systems/` | Movement, collision, input application |
| `game/world/WorldRenderer.ts` | Static map baking (runs once) |
| `game/systems/RenderSystem.ts` | Dynamic entity sprite sync |
| `ui/` | HUD and input widgets |

**Why:** Server simulation can reuse `game/systems/` and `game/world/` without Phaser. Client becomes a renderer + input collector.

### 4. System Pipeline

Systems implement `GameSystem { name, update(context, delta) }` and register with `SystemPipeline` in explicit order.

**Why:** Future systems (AI, combat, gathering, quests) register in one place. Order is visible and controllable — critical when interactions depend on sequencing.

### 5. Event Bus

Typed pub/sub (`GameEvents.PlayerMoved`, `GameEvents.Tick`) decouples systems from UI and future features.

**Why:** Quest system listens for `player:moved` without MovementSystem knowing quests exist. Chat, achievements, and analytics hook the same way.

### 6. Input Intent Model

`InputManager` produces `InputState` each frame. `InputIntent` is the serializable form `{ tick, movement }` ready for server messages.

**Why:** Multiplayer sends **intent**, not position. Server validates and returns authoritative state. Touch, keyboard, and future gamepad all produce the same shape.

### 7. Device Profile

Detected once at boot: input mode, low-end flag, camera zoom, target FPS, GPU preference, safe-area insets.

**Why:** Chromebooks and phones get lower zoom and 30 FPS target automatically. No separate mobile build.

### 8. Static Map Baking

`WorldRenderer` draws all terrain and objects into two `RenderTexture`s at load time — two images instead of ~2,000 individual sprites.

**Why:** Massive reduction in draw calls on integrated GPUs. Maps can grow with chunk baking using the same pattern.

---

## Why This Supports a Browser MMO

1. **No install, small initial load** — Procedural textures at boot; assets folder ready for lazy-loaded content later.
2. **Runs on weak hardware** — Baked maps, no antialiasing, low-power GPU preference, adaptive FPS.
3. **Touch + keyboard from day one** — `InputProvider` abstraction; gamepad slot is a new provider class.
4. **Network-ready shapes** — `WorldSnapshot`, `InputIntent`, tick counter, event bus.
5. **One world, not levels** — `WorldMap` is a continuous grid; `mapData.ts` becomes server-authored or streamed chunks.
6. **Feature growth without rewrites** — Add inventory as a component + system; add NPCs as entities; add quests as event listeners.

---

## Future Systems This Architecture Supports

| System | How it plugs in |
|--------|----------------|
| **Skills / XP** | `skills` component on player entity; `SkillSystem` in pipeline |
| **Gathering** | `interactable` component on trees/rocks; `InteractionSystem` reads input action |
| **Crafting** | `InventorySystem` + recipe data; UI panel in `ui/` |
| **Inventory** | `inventory` component; snapshot includes item arrays |
| **NPCs** | `createNpc()` factory; `AISystem` in pipeline |
| **Quests** | Listen on `EventBus` for `player:moved`, item pickup events |
| **Trading** | Server-mediated exchange; client shows `ui/TradePanel` |
| **Player housing** | Instanced tile region in `WorldMap`; load/unload as chunk |
| **Social / chat** | `EventBus` + network layer; UI overlay, no game logic coupling |
| **Multiplayer** | Server runs systems pipeline authoritatively; client predicts movement, reconciles snapshots |

---

## Recommended Next Milestone

**Server-authoritative gameplay** — move gathering, inventory, and quest completion to Supabase Edge Functions or a game server so clients cannot cheat. Presence/chat can stay on Realtime; game state needs validation.

Previous milestones (complete):
- **Auth & multiplayer** — Supabase login/register/forgot password, realtime player presence, world chat
- **NPCs and quests** — fetch quests with hand-in flow

---

## Auth & Multiplayer (Implemented)

```
src/auth/           Supabase AuthService (login, register, reset password)
src/network/        RealtimeService (presence + chat broadcast)
src/ui/auth/        DOM auth screen (mobile-friendly forms)
src/ui/ChatPanel.ts World chat overlay
supabase/migrations Profile table SQL
```

**Setup:** Copy `.env.example` → `.env` with your Supabase URL and anon key. Run `supabase/migrations/001_profiles.sql` in the Supabase SQL editor.

**Online flow:** Login → join `world:main` Realtime channel → presence syncs position at 10 Hz → other players render as blue sprites with name tags.

**Offline flow:** "Play Offline" skips auth and multiplayer; all single-player features work.

---

## Technical Decisions Before Full MMO

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Authority model** | Client-side vs server-authoritative | Server-authoritative (RS classic model) |
| **Transport** | WebSocket vs WebTransport | WebSocket first ( wider support on Chromebooks) |
| **Tick rate** | 10 / 20 / 30 Hz | 20 Hz server tick for movement + skills |
| **State sync** | Full snapshot vs delta | Delta snapshots keyed by tick |
| **Client prediction** | None vs movement prediction | Predict local player movement; reconcile on snapshot |
| **Interest management** | Full map vs area-of-interest | AOI radius around player (~30 tiles) |
| **Persistence** | Server DB vs edge cache | PostgreSQL/Supabase — profiles done; player progress save next |
| **Account flow** | OAuth vs email/password | Email/password + forgot password (implemented) |

---

## What We Deliberately Avoid (For Now)

- Combat systems
- Server-validated gathering (client-authoritative for now)
- Private messaging / friends lists
- Large asset downloads
- Complex shaders or 3D
- Level-based instancing (except future housing)

These are intentionally deferred so the foundation stays small, fast, and focused on the core loop: **walk around a persistent world on any device**.
