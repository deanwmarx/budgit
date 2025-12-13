# Multi‑Device Sync (RTDB) — Svelte + Capacitor + Firebase + WebRTC

## Scope

- Per-household realtime sync, opt-in.
- No custom server. No financial data in Firebase.
- Transport: WebRTC data channels (reliable, ordered).
- Coordination: Firebase (Auth, Firestore for identity, RTDB for presence/signaling).
- Foreground-only networking to save battery.
- Conflict resolution: Last Writer Wins (LWW) on updatedAt.

------

## 1. Modes

**Local-only household (default allowed)**

- No Firebase required.
- Full app works on local SQLite only.
- Backup/restore/export available (Google Drive or download CSV).

**Multi-device household (opt-in)**

- Requires sign-in (Firebase Auth).
- Firestore: users/devices/members.
- RTDB: presence/signaling only.
- WebRTC: all financial data sync.
- Paid-gate later if needed.
- Backup/restore/export available (Google Drive or download CSV).

------

## 2. Identity & Membership

**Auth:** Firebase Authentication (Email/Password at minimum with Google Sign-In as an option).

**Firestore collections:**

- users/{userId}: { email, name, createdAt, updatedAt, ... }
- devices/{deviceId}: { userId, deviceName, platform, createdAt }
- households/{householdId}: { name, budgetCycleStartDay, thresholds, ... }
- households/{householdId}/members/{userId}: { role: "admin"|"member"|"dependant", color, joinedAt, updatedAt }

**Eligibility to join household H as device D under user U:**

- auth.uid == U
- Firestore devices/{D}.userId == U
- Firestore households/{H}/members/{U} exists

**Local SQLite** mirrors users, device_info, households, members for UI/offline. Do not use local data as security authority.

------

## 3. Local Database (SQLite via Capacitor)

- Use existing normalized schema (users, device_info, households, members, months, budgets, transactions).
- Ensure createdAt/updatedAt on each sync'd table (already in schema).
- Soft delete: transactions.deletedAt (already present).

**Optional meta tables:**

```
applied_events(
  id TEXT PK,
  appliedAt INTEGER
)

pending_events(
  id TEXT PK,
  householdId TEXT,
  entityType TEXT,
  entityId TEXT,
  type TEXT,
  payload JSON,
  originUserId TEXT,
  originDeviceId TEXT,
  createdAt INTEGER,
  sentAt INTEGER NULL
)

sync_meta(
  householdId TEXT PK,
  lastSnapshotVersion INTEGER,
  lastSnapshotAt INTEGER,
  lastSyncedAt INTEGER
)
```

- Update lastSyncedAt on every successful sync (send or receive).
- Include lastSyncedAt in backup files.

------

## 4. Conflict Resolution

- **LWW using row.updatedAt vs event.createdAt:**
  - Apply only if event.createdAt > row.updatedAt; else ignore.
- Same rule on host and all guests.
- **Timestamp skew risk accepted** (typical 1-5s skew tolerated).

------

## 5. Permissions (Event Application Layer)

**Roles:** admin | member | dependant (per household).

**Enforce on device:**

- Before creating local event.
- Before applying incoming event (host drops unauthorized before rebroadcast).

**Defaults:**

- **admin:** full create/update/delete for months, budgets, transactions; manage members/settings.
- **member:** create/update/delete budgets, transactions; limited month ops.
- **dependant:** create transaction; update/delete only own (createdBy == originUserId); cannot create income; read-limited in UI.

------

## 6. Sync Topology

- **Per household (room):** one Host, N Guests (star).
- Host maintains WebRTC channels to all Guests for that household, applies events, broadcasts.
- Guests connect only to Host, send their events to Host, apply Host's broadcasts.

------

## 7. Foreground/Background (Capacitor)

**Source:** Capacitor App plugin appStateChange(isActive). You can also listen to pause/resume.

**Policy:**

- **Foreground:**
  - Household in focus → ACTIVE
  - Others → BACKGROUND
- **Background:**
  - All households → BACKGROUND

**ACTIVE transitions:**

- Join presence, start heartbeat (15s), participate in host election, establish WebRTC.

**BACKGROUND transitions:**

- Stop heartbeat, close WebRTC, leave (or let presence expire). If Host, relinquish role.

**Minimal code (JS, Runes):**

```
import { App } from '@capacitor/app';

onMount(() => {
  const sub = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      // foreground: activate focused household
    } else {
      // background: teardown all
    }
  });
  return () => sub.remove();
});
```

------

## 8. RTDB Data Structure (Option 1 — Minimal)

**Path root:** rooms/{householdId}/...

```
rooms/{householdId}/hostId: string | null

rooms/{householdId}/devices/{deviceId}:
  - userId: string
  - deviceName: string
  - platform: "android" | "ios" | "web"
  - lastSeen: number (ms)
  - joinedAt: number (ms)
  - lastSyncedAt: number (ms)

rooms/{householdId}/signaling/{deviceId}/inbox/{msgId}:
  - from: string (deviceId)
  - type: "offer" | "answer" | "ice"
  - payload: object (SDP or ICE)
  - ts: number (ms)
```

**Timings:**

- Heartbeat interval: 15000 ms (ACTIVE only).
- Offline threshold: 45000 ms (3 × heartbeat).
- On BACKGROUND: stop heartbeat; optional immediate delete devices/{D} (or let it expire).

------

## 9. WebRTC Configuration (STUN + TURN)

**ICE Servers:**

```
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN
  {
    urls: 'turn:YOUR_CLOUDFLARE_TURN_URL',
    username: 'YOUR_USERNAME',
    credential: 'YOUR_CREDENTIAL'
  }
];

const peerConnection = new RTCPeerConnection({ iceServers });
```

**Cloudflare TURN:**

- Free tier: 1TB/month
- Estimated capacity: ~50,000-80,000 actively syncing multi-device households/month
- TURN handles ~15-20% of connections (Symmetric NAT fallback)
- Financial data encrypted end-to-end via DTLS (TURN cannot decrypt)

**Setup:**

1. Sign up for Cloudflare account
2. Enable Cloudflare Calls/TURN service
3. Generate credentials
4. Configure ICE servers in WebRTC connection

------

## 10. Host Election (Client-Driven)

**Online devices:** those with lastSeen >= now - 45000 and in ACTIVE state.

**Rule:**

- hostId = device with **highest lastSyncedAt** among online devices
- If tie, use lexicographically smallest deviceId
- If none online, hostId = null

**Write:**

- Candidate sets rooms/{H}/hostId to itself (transaction if you want tighter race control).

**All clients watch hostId and switch connections accordingly.**

**Rationale:**

- Prevents restored backup devices with stale data from becoming Host
- Ensures most up-to-date device coordinates sync
- Restored device must be Guest first until caught up

------

## 11. WebRTC Signaling over RTDB

**Direction (recommended):** Host sends offer, Guest answers.

**Send (A→B):**

- Push to rooms/{H}/signaling/{B}/inbox with:
  - type: "offer" | "answer" | "ice"
  - payload: { sdp } or { candidate }
  - from: A
  - ts: now

**Receive:**

- B listens to rooms/{H}/signaling/{B}/inboxonChildAdded; handles and removes each message.

**Message shapes:**

- **Offer:**{ type: "offer", sdp: { type: "offer", sdp: string } }
- **Answer:**{ type: "answer", sdp: { type: "answer", sdp: string } }
- **ICE:**{ type: "ice", candidate: { candidate: string, sdpMid?, sdpMLineIndex? } }

------

## 12. Snapshot Spec (for fast convergence)

**Host sends snapshot to a guest:**

- On new connection
- On host switch (new connection triggers this)
- On guest request (gap/reconnect)

**Snapshot:**

```
{
  "type": "snapshot",
  "householdId": "...",
  "snapshotVersion": 123,
  "snapshotAt": 1700000000000,
  "rows": {
    "months": [...],
    "budgets": [...],
    "transactions": [...]
  }
}
```

**Apply on guest:**

- Pause live events
- Apply per-table upserts with LWW
- Optionally prune missing rows for household
- Update sync_meta.lastSyncedAt to snapshotAt
- Replay buffered events

------

## 13. Events (Shape — minimum)

```
{
  "id": "uuid",
  "householdId": "...",
  "entityType": "transaction|budget|month",
  "entityId": "...",
  "op": "create|update|delete",
  "payload": {...},
  "originUserId": "...",
  "originDeviceId": "...",
  "createdAt": 1700000000000
}
```

- Transactions carry createdBy in the row
- Enforce dependant "own only" at apply time
- Update sync_meta.lastSyncedAt after applying event

------

## 14. Backups/Export

**Google Drive backup:**

- Daily/weekly/monthly (weekly default). Manual backup "now".
- Upload full DB or zipped CSV set with metadata.
- **Include sync_meta.lastSyncedAt in backup metadata.**
- Restore: local-only overwrite; multi-device reconcile via LWW/snapshot post-restore.

**Single-file CSV export (optional, no Google):**

- One CSV with union schema:
  - First columns: table, op
  - Then union of all table columns (prefixed by table names)
- Import reads rows by table and dependency order
- Multi-device imports treated as local edits

------

## 15. Security Model (concise)

**No financial data in Firebase.**

**Eligibility to join H:**

- User signed-in
- devices/{D}.userId == auth.uid
- households/{H}/members/{auth.uid} exists

**RTDB rules (conceptual):**

- Auth required.
- Write to rooms/{H}/devices/{D} only by that device's user.
- Read rooms/{H}/hostId, rooms/{H}/devices for members.
- Write to rooms/{H}/signaling/{target}/inbox only if sender is present in devices/{...} (and is member).
- Read rooms/{H}/signaling/{myDeviceId}/inbox only by that device's user.

**Permissions on financial ops enforced app-side (host and guests).**

**WebRTC DTLS encryption:**

- Financial data encrypted end-to-end
- TURN server cannot decrypt data (only relays encrypted packets)
- Metadata visible: IP addresses, packet sizes, timing, connection duration

------

## 16. Defaults / Constants

- Heartbeat: 15000 ms
- Offline threshold: 45000 ms
- Active debounce: ~400 ms
- Background debounce: ~1200 ms
- One ACTIVE household at a time (focused route)

------

## 17. What "reliable" means here

- Eventual consistency with LWW
- No background sockets; reconnection on foreground
- TURN fallback for Symmetric NAT (~15-20% of connections)
- STUN-only success rate: ~80-85%
- STUN + TURN success rate: ~95%+
- Use public STUN (Google) and Cloudflare TURN

------

## 18. Minimal Client API (you implement)

**Lifecycle:**

- Listen appStateChange and route focus → drive ACTIVE/BACKGROUND

**RTDB:**

- presenceJoin(h), presenceHeartbeat(h), presenceLeave(h)
- watchHostId(h, cb), watchDevices(h, cb)
- sendSignal(h, toDeviceId, msg), watchInbox(h, myDeviceId, onMsg)

**WebRTC:**

- startHostFor(h), startGuestFor(h, hostDeviceId), stopFor(h)
- sendEvent(h, event), onEvent(h, handler)
- snapshotRequest(h), onSnapshot(h, handler)

------

## 19. Out-of-Scope (now)

- CRDT merging
- End-to-end encryption beyond DTLS (add later if you want zero-knowledge on top of WebRTC)
- Server-enforced business permissions (no central server here)

# Implementation

## Phase 1: Foundation & Local Database

### 1.1 SQLite Schema Updates

- Add lastSyncedAt INTEGER column to sync_meta table
- Add lastSyncedAt INTEGER column to device_info table
- Create applied_events table (id, appliedAt)
- Create pending_events table (id, householdId, entityType, entityId, type, payload, originUserId, originDeviceId, createdAt, sentAt)
- Verify all sync tables have createdAt/updatedAt columns
- Test schema migrations

### 1.2 Sync Metadata Management

- Create updateLastSyncedAt(householdId, timestamp) function
- Create getLastSyncedAt(householdId) function
- Create storePendingEvent(event) function
- Create markEventApplied(eventId) function
- Create getPendingEvents(householdId) function

------

## Phase 2: Firebase Setup

### 2.1 Firebase Project Configuration

- Create Firebase project
- Enable Firebase Authentication (Email/Password)
- Set up Firestore database
- Set up Realtime Database (RTDB)
- Install Firebase SDK in Svelte project
- Configure Firebase credentials (environment variables)

### 2.2 Firestore Collections & Rules

- Create users collection structure
- Create devices collection structure
- Create households collection structure
- Create households/{id}/members subcollection structure
- Write Firestore security rules for users
- Write Firestore security rules for devices
- Write Firestore security rules for households and members
- Test Firestore rules with Firebase Emulator

### 2.3 RTDB Structure & Rules

- Design rooms/{householdId}/hostId path
- Design rooms/{householdId}/devices/{deviceId} structure
- Design rooms/{householdId}/signaling/{deviceId}/inbox/{msgId} structure
- Write RTDB security rules for presence
- Write RTDB security rules for signaling
- Test RTDB rules with Firebase Emulator

------

## Phase 3: Authentication & Identity

### 3.1 Firebase Authentication

- Create sign-up flow (email/password)
- Create sign-in flow (email/password)
- Create sign-out flow
- Store authenticated user in app state
- Handle auth state changes (onAuthStateChanged)
- Create "Local-only" vs "Multi-device" mode toggle in UI

### 3.2 User & Device Registration

- Generate unique deviceId on first launch (store in local storage)
- Create Firestore users/{userId} document on sign-up
- Create Firestore devices/{deviceId} document on sign-in
- Sync user data to local SQLite users table
- Sync device data to local SQLite device_info table
- Handle device name editing

### 3.3 Household & Member Management

- Create household (Firestore + SQLite)
- Add members to household (Firestore members subcollection)
- Assign roles (admin/member/dependant)
- Sync household data to SQLite
- Sync members data to SQLite
- Create UI for inviting members (generate invite codes/links)
- Create UI for accepting invites

------

## Phase 4: WebRTC Configuration

### 4.1 Cloudflare TURN Setup

- Sign up for Cloudflare account
- Enable Cloudflare Calls/TURN service
- Generate TURN credentials
- Store TURN credentials securely (environment variables)
- Test TURN connectivity

### 4.2 ICE Server Configuration

- Create getIceServers() function returning STUN + TURN config
- Add Google STUN server (stun:stun.l.google.com:19302)
- Add Cloudflare TURN server with credentials
- Handle credential rotation (if needed)

------

## Phase 5: Presence System

### 5.1 Presence Join/Leave

- Create presenceJoin(householdId, deviceId, userId) function
- Write device data to rooms/{H}/devices/{D} (userId, deviceName, platform, lastSeen, joinedAt, lastSyncedAt)
- Create presenceLeave(householdId, deviceId) function
- Remove device from rooms/{H}/devices/{D}

### 5.2 Heartbeat System

- Create presenceHeartbeat(householdId, deviceId) function
- Update lastSeen timestamp every 15s
- Start heartbeat interval on ACTIVE state
- Stop heartbeat interval on BACKGROUND state
- Handle reconnection logic if RTDB connection drops

### 5.3 Presence Watchers

- Create watchDevices(householdId, callback) function
- Listen to rooms/{H}/devices changes
- Filter online devices (lastSeen >= now - 45000ms)
- Notify callback on device join/leave/update

------

## Phase 6: Host Election

### 6.1 Host Election Logic

- Create calculateHostId(devices) function
- Sort online devices by lastSyncedAt (descending), then deviceId (lexicographic)
- Return highest lastSyncedAt device as Host
- Handle tie-breaking with deviceId

### 6.2 Host Election Coordination

- Create watchHostId(householdId, callback) function
- Listen to rooms/{H}/hostId changes
- Create electHost(householdId, deviceId) function
- Write deviceId to rooms/{H}/hostId (use transaction for race control)
- Trigger election when devices change
- Notify callback when hostId changes

### 6.3 Role Switching

- Detect when current device should become Host
- Detect when current device should become Guest
- Detect when current device's Host changes (reconnect to new Host)
- Gracefully close connections on role switch

------

## Phase 7: WebRTC Signaling

### 7.1 Signaling Infrastructure

- Create sendSignal(householdId, toDeviceId, message) function
- Push message to rooms/{H}/signaling/{toDeviceId}/inbox
- Create watchInbox(householdId, myDeviceId, onMessage) function
- Listen to rooms/{H}/signaling/{myDeviceId}/inbox onChildAdded
- Remove message after processing

### 7.2 Offer/Answer Exchange (Host→Guest)

- Host: Create RTCPeerConnection with ICE servers
- Host: Create data channel (householdSync)
- Host: Create offer (createOffer)
- Host: Set local description (setLocalDescription)
- Host: Send offer to Guest via signaling
- Guest: Receive offer, create RTCPeerConnection
- Guest: Set remote description with offer
- Guest: Create answer (createAnswer)
- Guest: Set local description with answer
- Guest: Send answer to Host via signaling
- Host: Receive answer, set remote description

### 7.3 ICE Candidate Exchange

- Listen to onicecandidate event
- Send ICE candidate to peer via signaling
- Receive ICE candidate from peer
- Add ICE candidate to RTCPeerConnection (addIceCandidate)

### 7.4 Connection Management

- Monitor onconnectionstatechange event
- Handle connected state
- Handle disconnected state (reconnect logic)
- Handle failed state (fallback to TURN if needed)
- Handle closed state (cleanup)

------

## Phase 8: WebRTC Data Channels

### 8.1 Data Channel Setup

- Host: Create data channel on RTCPeerConnection
- Guest: Listen to ondatachannel event
- Set channel to reliable, ordered mode
- Handle onopen event (channel ready)
- Handle onclose event (channel closed)
- Handle onerror event

### 8.2 Message Sending

- Create sendEvent(householdId, event) function
- Serialize event to JSON
- Send via data channel (channel.send)
- Handle send failures (buffer full, not open)

### 8.3 Message Receiving

- Create onEvent(householdId, handler) function
- Listen to onmessage event on data channel
- Parse JSON event
- Call handler with parsed event

------

## Phase 9: Event Creation & Application

### 9.1 Event Creation

- Create createEvent(entityType, entityId, op, payload) function
- Generate UUID for event id
- Capture householdId, originUserId, originDeviceId, createdAt
- Store event in pending_events table
- Return event object

### 9.2 Event Application (LWW)

- Create applyEvent(event) function
- Check if event already applied (applied_events table)
- Validate permissions based on originUserId role
- For create: Insert if not exists
- For update: Update only if event.createdAt > row.updatedAt
- For delete: Set deletedAt only if event.createdAt > row.updatedAt
- Mark event as applied in applied_events table
- Update sync_meta.lastSyncedAt to event.createdAt

### 9.3 Event Broadcasting (Host Only)

- Receive event from Guest or local device
- Apply event locally with LWW
- Broadcast event to all other connected Guests (excluding sender)
- Handle broadcast failures (Guest disconnected)

------

## Phase 10: Snapshot System

### 10.1 Snapshot Generation (Host)

- Create generateSnapshot(householdId) function
- Query all months for household from SQLite
- Query all budgets for household from SQLite
- Query all transactions for household from SQLite
- Increment snapshotVersion in sync_meta
- Capture snapshotAt timestamp
- Return snapshot object { type, householdId, snapshotVersion, snapshotAt, rows }

### 10.2 Snapshot Sending

- Send snapshot on new Guest connection
- Send snapshot on Guest request
- Serialize snapshot to JSON
- Handle large snapshots (chunking if needed, or trust data channel buffering)

### 10.3 Snapshot Application (Guest)

- Create applySnapshot(snapshot) function
- Pause live event processing (buffer incoming events)
- Clear existing household data (optional: soft delete)
- Upsert months with LWW (snapshot.snapshotAt vs row.updatedAt)
- Upsert budgets with LWW
- Upsert transactions with LWW
- Update sync_meta.lastSyncedAt to snapshot.snapshotAt
- Update sync_meta.lastSnapshotVersion to snapshot.snapshotVersion
- Resume event processing (replay buffered events)

------

## Phase 11: Permissions Enforcement

### 11.1 Role-Based Checks

- Create getUserRole(userId, householdId) function (query SQLite members)
- Create canCreate(userId, entityType) function
- Create canUpdate(userId, entityType, entityId) function
- Create canDelete(userId, entityType, entityId) function

### 11.2 Permission Rules

- Implement admin permissions (full access)
- Implement member permissions (budgets/transactions, limited months)
- Implement dependant permissions:
  - Can create transaction (expense only, not income)
  - Can update/delete only own transactions (createdBy == userId)
  - Read-limited in UI

### 11.3 Enforcement Points

- Check permissions before creating local event
- Check permissions before applying incoming event (Host + Guest)
- Host: Drop unauthorized events before broadcasting
- Log permission violations for debugging

------

## Phase 12: Foreground/Background Lifecycle

### 12.1 App State Listener

- Import Capacitor App plugin
- Add appStateChange listener in root component
- Detect isActive: true (foreground)
- Detect isActive: false (background)

### 12.2 Household State Management

- Track "focused household" (current route/view)
- Set focused household to ACTIVE on foreground
- Set all households to BACKGROUND on background

### 12.3 ACTIVE State Transitions

- Join presence (presenceJoin)
- Start heartbeat (15s interval)
- Participate in host election
- Establish WebRTC connection (as Host or Guest)

### 12.4 BACKGROUND State Transitions

- Stop heartbeat interval
- Close WebRTC connections
- Leave presence (presenceLeave) or let expire
- If Host, trigger new election (relinquish role)

### 12.5 Debouncing

- Add ~400ms debounce for ACTIVE transitions (avoid rapid switches)
- Add ~1200ms debounce for BACKGROUND transitions

------

## Phase 13: Full Sync Flow Integration

### 13.1 Host Flow

- On ACTIVE: Join presence, participate in election
- If elected Host: Start listening for Guest connections
- On Guest connection: Send snapshot to Guest
- On local edit: Create event, apply locally, broadcast to Guests
- On Guest event: Apply with LWW, broadcast to other Guests
- On BACKGROUND: Stop heartbeat, relinquish Host role

### 13.2 Guest Flow

- On ACTIVE: Join presence, watch hostId
- When hostId set: Initiate WebRTC connection to Host
- On connection: Receive snapshot from Host, apply
- On local edit: Create event, send to Host
- On Host broadcast: Apply event with LWW
- On Host change: Disconnect from old Host, connect to new Host
- On BACKGROUND: Stop heartbeat, close connection

### 13.3 Reconnection Logic

- Detect WebRTC connection loss
- Retry connection with exponential backoff
- Request snapshot after reconnection
- Handle "Host offline" scenario (wait for new election)

------

## Phase 14: Backup & Restore

### 14.1 Backup Metadata

- Include sync_meta.lastSyncedAt in backup files
- Include backup timestamp
- Include device info (deviceId, userId)

### 14.2 Backup to Google Drive

- Set up Google Drive API integration
- Implement daily/weekly/monthly scheduled backups (weekly default)
- Implement manual "Backup Now" button
- Upload full SQLite DB or zipped CSV
- Store backup metadata

### 14.3 Restore from Backup

- Download backup from Google Drive
- Parse backup file
- Restore to local SQLite (overwrite or merge)
- Restore sync_meta.lastSyncedAt value
- On next sync: Device acts as Guest (lower lastSyncedAt)
- Host sends snapshot, LWW reconciles data

### 14.4 CSV Export/Import

- Implement single-file CSV export (union schema)
- Include table and op columns
- Implement CSV import (parse by table, dependency order)
- Treat imports as local edits (generate events)

------

## Phase 15: UI & User Experience

### 15.1 Sync Status Indicators

- Show "Syncing..." indicator when events being sent/received
- Show "Connected" status when WebRTC active
- Show "Offline" status when disconnected
- Show current role (Host/Guest)
- Show connected device count (Host only)

### 15.2 Settings & Configuration

- Toggle between Local-only and Multi-device modes
- Display household members and roles
- Edit member roles (admin only)
- Remove members (admin only)
- Leave household option
- Delete household option (admin only, with confirmation)

### 15.3 Conflict/Error Handling UI

- Show error toast on sync failure
- Show warning if WebRTC connection fails (check network)
- Optional: Show notification when edit overwritten (low priority)

------

## Phase 16: Testing & Edge Cases

### 16.1 Unit Tests

- Test LWW conflict resolution (various timestamp scenarios)
- Test permission enforcement (all roles × all operations)
- Test host election logic (various device combinations)
- Test event application (create/update/delete)
- Test snapshot generation and application

### 16.2 Integration Tests

- Test 2-device sync (Host + Guest)
- Test 3-device sync (Host + 2 Guests)
- Test host failover (Host goes offline, new Host elected)
- Test simultaneous edits (same transaction on 2 devices)
- Test offline editing (pending events queued, sent on reconnect)

### 16.3 Edge Case Testing

- Test device with old backup restored (should not become Host)
- Test all devices offline, then come back
- Test rapid foreground/background switching
- Test WebRTC connection failure (STUN fails, TURN fallback)
- Test Firebase connection loss (RTDB offline)
- Test clock skew scenarios (5s, 30s differences)
- Test dependant permissions (can only edit own transactions)

### 16.4 Performance Testing

- Test large snapshot (1000+ transactions)
- Test high-frequency events (rapid edits)
- Test bandwidth usage (monitor TURN traffic)
- Test battery impact (foreground sync active)

------

## Phase 17: Production Readiness

### 17.1 Error Logging & Monitoring

- Set up error tracking (Sentry, LogRocket, etc.)
- Log sync errors with context (deviceId, householdId, event)
- Monitor TURN bandwidth usage
- Track WebRTC connection success rate

### 17.2 Security Hardening

- Review and test Firebase security rules
- Ensure no financial data reaches Firebase/TURN
- Verify DTLS encryption on WebRTC
- Implement rate limiting on signaling (prevent spam)

### 17.3 Documentation

- Write user guide for multi-device setup
- Document troubleshooting steps (connection issues)
- Document backup/restore procedures
- Create developer docs for sync architecture

### 17.4 Gradual Rollout

- Beta test with small user group
- Monitor sync metrics (success rate, latency, bandwidth)
- Gather user feedback
- Fix critical bugs before wider release
- Roll out to all users

------

## Suggested Implementation Order

**Sprint 1:** Phase 1, 2, 3 (Foundation, Firebase, Auth)
**Sprint 2:** Phase 4, 5, 6 (WebRTC config, Presence, Host election)
**Sprint 3:** Phase 7, 8 (Signaling, Data channels)
**Sprint 4:** Phase 9, 10 (Events, Snapshots)
**Sprint 5:** Phase 11, 12, 13 (Permissions, Lifecycle, Full sync)
**Sprint 6:** Phase 14, 15 (Backup, UI)
**Sprint 7:** Phase 16, 17 (Testing, Production readiness)