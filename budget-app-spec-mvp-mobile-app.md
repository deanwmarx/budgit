# Household Budget Tracker — Functional Specification (MVP)

**Platform:** Android-first (Svelte 5 + Capacitor 6), iOS post-MVP

**Framework:** Vite + Svelte 5 (SPA mode)

**Language:** JavaScript with JSDoc type annotations

**Database:** 
- SQLite (local device storage via Capacitor)
- Firebase Firestore (metadata only - users, households, members)
- Firebase RTDB (temporary sync queue, auto-deleted)

**Authentication:** Firebase Auth (email/password, role-based in Firestore)

**Native APIs:** Capacitor 6 plugins
- @capacitor/app (lifecycle, back button handling)
- @capacitor/preferences (local settings)
- @capacitor/device (device info)

**UI Styling:** Tailwind CSS 4 (CSS-based config)

**Navigation:** State-based component switching (no router library)

**Architecture:** Local-first with SQLite, metadata in Firestore, RTDB for sync relay

**Scope:** MVP (roles = admin & member, calendar-month budgeting, household budgets with roll-over)

---

## 1. Core Purpose

A shared household budgeting app where:

- ✅ Incomes & expenses are tracked against budget categories
- ✅ Fixed items and budgets roll forward into future budget months (salary, rent, budgets)
- ✅ Budget months are based on configurable cycle start day (e.g., 25th of each month)
- ✅ Each month can be edited at any time (current or historical)
- ✅ Users have Admin + Member roles
- ✅ Data works offline, syncs when online
- ✅ Users can belong to multiple households
- ✅ Household-based access (admin + members per household)
- ✅ All financial data stored locally on device (never in Firestore)
- ✅ RTDB used only as temporary sync relay (auto-deleted after sync)

---

## 2. Data Storage Architecture

### Critical Principle: Local-First Financial Data

**Financial data is NEVER stored permanently in Firestore. Only temporarily in RTDB for sync (1-5 minutes typical, 7 days max).**

### Storage Locations

#### SQLite (Device Only - Permanent Storage)

ALL financial data lives here permanently:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  householdIds TEXT,              -- JSON array: ["household-1", "household-2"]
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  budgetCycleStartDay INTEGER DEFAULT 25,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE household_members (
  householdId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL,             -- "admin" | "member"
  color TEXT NOT NULL,            -- "Blue", "Green", etc.
  joinedAt INTEGER,
  updatedAt INTEGER,
  PRIMARY KEY (householdId, userId)
);

CREATE TABLE months (
  id TEXT PRIMARY KEY,            -- "2025-10"
  householdId TEXT NOT NULL,
  startDate TEXT NOT NULL,        -- "2025-09-25"
  endDate TEXT NOT NULL,          -- "2025-10-24"
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  monthId TEXT NOT NULL,
  groupName TEXT NOT NULL,        -- "Groceries", "Petrol"
  amount INTEGER NOT NULL,        -- Stored as cents
  createdAt INTEGER,
  updatedAt INTEGER,
  UNIQUE(monthId, groupName)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  monthId TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  userIds TEXT NOT NULL,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(
    (type = 'income' AND category IN ('salary', 'one_time')) OR
    (type = 'expense' AND category IN ('fixed', 'variable', 'incidental'))
  ),
  budgetGroup TEXT CHECK(
    budgetGroup IS NULL OR 
    (type = 'expense' AND category = 'variable')
  ),
  date TEXT NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER,
  createdBy TEXT,
  deletedAt INTEGER,
  
  INDEX idx_month_type (monthId, type),
  INDEX idx_month_deleted (monthId, deletedAt)
);

CREATE TABLE sync_log (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL,       -- "transaction", "budget"
  entityId TEXT NOT NULL,
  operation TEXT NOT NULL,
  fieldName TEXT,
  oldValue TEXT,
  newValue TEXT,
  deviceId TEXT NOT NULL,
  deviceName TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  
  INDEX idx_synced (synced),
  INDEX idx_entity (entityId),
  INDEX idx_timestamp (timestamp)
);

CREATE TABLE device_info (
  deviceId TEXT PRIMARY KEY,
  deviceName TEXT NOT NULL,
  userId TEXT NOT NULL,
  lastActive INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
```

**This data NEVER leaves the device except temporarily through RTDB sync relay.**

---

#### Firestore (Cloud - Metadata Only, Permanent)

Only non-financial metadata:

```javascript
// Firestore collections
users/{userId}
  email: string                   // "dean@example.com"
  name: string                    // "Dean"
  householdIds: string[]          // ["household-abc-123"]
  createdAt: timestamp
  updatedAt: timestamp

households/{householdId}
  name: string                    // "Smith Household"
  budgetCycleStartDay: number     // 25
  createdAt: timestamp
  updatedAt: timestamp
  
  members/{userId}                // Subcollection
    role: string                  // "admin" | "member"
    color: string                 // "Blue"
    joinedAt: timestamp
    updatedAt: timestamp
  
  devices/{deviceId}              // Subcollection
    deviceId: string
    deviceName: string            // "Dean's Pixel 6"
    userId: string
    lastActive: timestamp
    createdAt: timestamp
```

**Notice what's MISSING from Firestore:**

- ❌ No months collection
- ❌ No income collection
- ❌ No expenses collection
- ❌ No budgets collection
- ❌ No amounts anywhere

**What IS stored:**

- ✅ User identity (email, name)
- ✅ Household membership (who belongs to which household)
- ✅ Roles and colors (admin vs member)
- ✅ Household settings (name, cycle start day)
- ✅ Device registration (for sync ACK tracking)

---

#### Firebase RTDB (Cloud - Temporary Relay, Auto-Deleted)

Operation logs only (not full records). Used as sync relay between devices.

```javascript
// RTDB structure
sync_queue/{householdId}/{batchId}
  deviceId: string                // "device-dean"
  deviceName: string              // "Dean's Pixel 6"
  operations: [
    {
      id: string,                 // "op-uuid-123"
      entityType: string,         // "transaction"
      entityId: string,           // "txn-xyz-789"
      operation: string,          // "create"
      fieldName: string | null,   // null for create/delete
      oldValue: string | null,    // JSON serialized (null for create)
      newValue: string,           // JSON serialized full object
      deviceId: string,
      deviceName: string,
      timestamp: number           // Unix timestamp
    },
    // ... more operations
  ]
  timestamp: number               // Batch creation time
  status: string                  // "pending" | "completed"
  acks: {
    [deviceId]: number            // Timestamp when device ACK'd
  }
  expiresAt: number               // Auto-delete timestamp (now + 7 days)
  expectedDevices: string[]       // List of active device IDs at upload time
```

**Example operation in RTDB:**

```json
{
  "id": "op-abc-123",
  "entityType": "transaction",
  "entityId": "txn-xyz-789",
  "operation": "create",
  "fieldName": null,
  "oldValue": null,
  "newValue": "{\"id\":\"txn-xyz-789\",\"type\":\"expense\",\"category\":\"variable\",\"budgetGroup\":\"Groceries\",\"amount\":15000,...}",
  "deviceId": "device-dean",
  "deviceName": "Dean's Pixel 6",
  "timestamp": 1699887600000
}
```

**Lifecycle:**

1. **Created:** When Device A syncs (uploads operations)
2. **Exists:** Until all expected devices ACK AND/OR 7 days pass
3. **Deleted:** Automatically after all devices synced or 7-day expiry

**Maximum time in RTDB:** 7 days (if devices offline, auto-cleanup deletes it)

**Typical time in RTDB:** 1-5 minutes (devices ACK quickly when online)

**Key principle:** Batches remain until ALL active household devices acknowledge receipt. This prevents data loss if a device is temporarily offline.

---

### Data Lifetime Comparison

| Data Type | SQLite (Device) | Firestore | RTDB |
|-----------|----------------|-----------|------|
| Users | Permanent | Permanent | ❌ Never |
| Households | Permanent | Permanent | ❌ Never |
| Members | Permanent | Permanent | ❌ Never |
| Devices | Permanent | Permanent | ❌ Never |
| Months | Permanent | ❌ Never | ❌ Never |
| Budgets | Permanent | ❌ Never | ❌ Never |
| Income | Permanent | ❌ Never | ❌ Never |
| Expenses | Permanent | ❌ Never | ❌ Never |
| Operations | Permanent (log) | ❌ Never | 1-5 min typical, 7 days max |

---

### Privacy Analysis

**What You (Developer) Can See in Firebase Console:**

**Firestore:**
- User emails and names
- Household names
- Who belongs to which household
- User roles (admin/member)
- User colors (UI identifier)
- Device names and registration info
- **You CANNOT see:** Any income amounts, expense amounts, budget amounts, transaction names

**RTDB:**
- Operation logs temporarily (while sync in progress)
- Example: You'd see `"entityType": "expense"` and full expense object in `newValue` field
- **BUT:** Auto-deleted within minutes to hours (max 7 days)
- **Visibility window:** Only operations currently in sync queue

**SQLite:**
- Completely inaccessible (lives on user devices only)
- Not backed up to Firebase
- Not synced to any cloud storage
- Only accessible through RTDB sync relay (temporarily)

---

## 3. RTDB Sync Architecture

### Device Registration & Management

#### Device Information Storage

**Device Initialization (First Launch):**

```javascript
async function initializeDevice(userId) {
  let deviceId = await Preferences.get({ key: 'deviceId' });
  
  if (!deviceId.value) {
    deviceId = crypto.randomUUID();
    await Preferences.set({ key: 'deviceId', value: deviceId });
    
    // Get device name from system
    const info = await Device.getInfo();
    const deviceName = `${info.manufacturer} ${info.model}`;
    
    await db.run(
      `INSERT INTO device_info 
       (deviceId, deviceName, userId, lastActive, createdAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [deviceId, deviceName, userId, Date.now(), Date.now()]
    );
  }
  
  return deviceId.value;
}

async function updateDeviceActivity() {
  await db.run(
    'UPDATE device_info SET lastActive = ? WHERE deviceId = ?',
    [Date.now(), await getCurrentDeviceId()]
  );
}
```

**Register Device in Household:** When user first accesses a household, register device in Firestore. Firestore path: households/{householdId}/devices/{deviceId} with fields: deviceId (string), deviceName (string like "Dean's Pixel 6"), userId (string), lastActive (timestamp), createdAt (timestamp).

#### Device Management Screen (User Settings)

**Location:** User profile/settings menu

**Display:** List all devices registered to current user across all households. Show device name, last active time, and current device indicator.

**UI Example:** My Devices section shows [•] Dean's Pixel 6 (This device) - Last active: Just now - Registered: 5 days ago. Below that [ ] Dean's Old Samsung - Last active: 3 days ago - Registered: 2 months ago with [Remove Device] button.

**Remove Device:** User can revoke/remove old devices. Confirmation dialog: "Remove [device name]? This device will no longer sync data." Deletes device document from all households user belongs to. Does NOT delete local SQLite data (device can re-register if still active).

**Admin View (Household Devices):** Admin can see all devices across all household members. Example: Household Devices shows Dean (Admin) with Dean's Pixel 6 (Last active: Just now) and Dean's Old Samsung (Last active: 3 days ago) with [Remove] button. Spouse (Member) section shows Spouse's iPhone (Last active: 1 hour ago). Admin can remove any device to prevent inactive devices from blocking sync.

### Sync Queue Logic

#### ACK Logic: Keep Until All Devices Synced

Batches remain in RTDB until all active household devices acknowledge receipt.

**Upload Flow:** Get all active devices in household from Firestore. Create batch with operations array, timestamp, status "pending", empty acks object, expiresAt (7 days from now), and expectedDevices array (all active device IDs). Upload to RTDB at sync_queue/{householdId}/{batchId}. Mark operations as synced=1 in local sync_log immediately (don't wait for ACKs).

**Processing Flow (Receiving Device):** Listen to RTDB sync_queue/{householdId}. For each batch, skip if it's from current device. For each operation in batch, check if operation ID already exists in local sync_log. If already processed, skip to prevent duplicates. Apply operation (create/update/delete in SQLite). Record operation in sync_log with synced=1. Send ACK by updating acks/{deviceId} with current timestamp. Check if all expected devices have ACK'd. If yes, delete batch from RTDB.

**Auto-Cleanup (Cloud Function):** Runs every 6 hours. Queries all sync_queue batches. Deletes any batch where expiresAt is less than current time. Handles cases where devices are lost/removed and never ACK.

**Summary:** Batches stay in RTDB until all active devices ACK. If device removed from household, its ACK no longer required (update expectedDevices). Batches auto-delete after 7 days regardless (handles lost/inactive devices). Operation IDs ensure idempotency (no duplicate processing).

### Sync Log Pruning

Add maintenance task to prevent sync_log bloat. Task runs monthly to delete old synced operations.

**Implementation:** Query sync_log WHERE synced = 1 AND timestamp < sixMonthsAgo. Delete matching rows. Log number of pruned entries.

**Rules:** Only delete operations where synced = 1. Keep last 6 months of history. Never delete unsynced operations (synced = 0).

**Scheduling:** Run on app launch plus 30-day interval. Prevents SQLite query slowdown. Keeps IndexedDB under 50MB limit.

### Sync Status Indicator

**Location:** Top-right corner of navigation header (next to household name)

**States:**
- ✅ Synced (green dot): All changes uploaded, no pending operations
- ⏳ Syncing... (yellow dot, animated): Upload in progress
- ⚠️ Offline (red dot): No network connection
- 🔄 Pending Sync (orange dot): Operations queued, waiting for network

**Implementation:** Create syncStatus store with status ('synced' | 'syncing' | 'offline' | 'pending') and pendingCount (number). Update status based on navigator.onLine and count of sync_log WHERE synced = 0. Listen for 'online' and 'offline' events. Trigger sync when pending operations detected.

**UI Display:** Show colored dot with status text. User can tap indicator to view sync details modal showing last sync time, pending operation count, and recent activity log.

---

## 4. Roles (MVP)

**Admin:**
- Creates household
- Adds/removes users
- Assigns roles and colors
- Sets and edits budgets (in month setup)
- Configures household settings (budgetCycleStartDay)
- Can view/edit all incomes and expenses
- Can remove any device from household

**Member:**
- Can view/edit ALL incomes and expenses (not restricted to own)
- Cannot manage household settings or users
- Cannot manage budgets
- Cannot change budgetCycleStartDay
- Can manage own devices only

**Note:** For MVP simplicity, members have full edit access to all financial data. Permission granularity comes later.

---

## 5. Authentication & User Management

### Bootstrap Admin (One-Time Setup)

Manual setup via Firebase Console:

**1. Create Admin User in Firebase Authentication**
- Navigate to Firebase Console → Authentication
- Add user with email + password
- Copy the generated userId

**2. Create User Document**
- Navigate to Firestore → Create collection `users`
- Create document with ID = userId from step 1
- Set fields: email ("admin@example.com"), name ("Admin Name"), passwordSet (true), householdIds ([]), createdAt (timestamp), updatedAt (timestamp)

**3. Create Household Document**
- Create collection `households`
- Auto-generate document ID (this becomes householdId)
- Set fields: name ("Smith Household"), budgetCycleStartDay (25), createdAt (timestamp)
- Copy the generated householdId

**4. Link Admin to Household**
- Navigate to households/{householdId} (from step 3)
- Create subcollection `members`
- Create document with ID = userId from step 1
- Set fields: role ("admin"), color ("Blue"), joinedAt (timestamp), updatedAt (timestamp)
- Update user document: Add householdId to householdIds array

**5. Admin Login**
- Admin logs into app with email/password from step 1
- App queries households and navigates to the household

### Household Selection on Login

**Flow:**

1. User logs in with email/password
2. App retrieves user document to get householdIds array
3. **If 1 household found:** Navigate directly to that household's dashboard
4. **If 2+ households found:** Show household selection screen. List household names (fetch household documents using householdIds). User taps to select. App stores selected householdId in app state.
5. **If 0 households found:** Show error (user not linked to any household)

**Household Context:** Selected householdId stored in Svelte stores ($state runes). All queries scoped to current household. User can switch households via settings menu. Real-time listener on user document keeps householdIds array updated.

**Performance Note:** Single user document read (1 read) instead of collection group query (N reads). Optimized for Firebase free tier limits (50K reads/day). householdIds array eliminates need for expensive collection group queries.

### Adding Members (Admin-Only)

**Admin flow in app:**

1. Navigate to "Household Members" screen
2. Tap "Add Member"
3. Fill form: Name (required), Email (required, must be unique), Color (dropdown showing available colors only), Role (admin/member selector)
4. App validates email doesn't already exist in household members
5. App creates user document in users/{newUserId} collection with email, name, passwordSet (false), householdIds ([householdId]), createdAt, updatedAt
6. App creates member document in households/{householdId}/members/{newUserId} with role, color, joinedAt, updatedAt
7. Cloud Function triggers on member document creation: Creates Firebase Auth account with provided email. Sets random temporary password. Sends email/SMS with app install instructions.

**Member First Login:**
1. Member installs app
2. Enters email on login screen
3. App checks users/{userId} doc: if passwordSet=false, shows "Set Your Password" screen
4. Member sets password
5. App updates passwordSet=true in user document
6. Normal login flow proceeds (household selection)

**Fallback Approach (if Cloud Function takes too long):** Admin creates member documents manually (user + household member). Member taps "First Time User" on login screen. Enters email (app validates against members collection). Creates own Auth account + sets password directly. No Cloud Function needed.

**Cloud Function Implementation:** Firestore trigger on households/{householdId}/members/{userId} onCreate. Get user document to retrieve email. Generate random temporary password. Create Firebase Auth user with createUser(uid, email, password, displayName). Send email/SMS with instructions.

### Household Member Limit

**Hard limit:** 8 members per household (matches 8-color palette)

**Validation:** Before adding member, count existing members. If count >= 8, throw error: "Maximum 8 members per household. Remove a member or upgrade to custom colors (future feature)." Check available colors. If all 8 colors used, throw error: "All colors in use. Remove a member first."

**UI State:** When 8 members exist, "Add Member" button is disabled. Tooltip: "Maximum 8 members (all colors in use). Remove a member to add new one." Future enhancement note: "Custom color picker coming soon"

**Documentation:** Add to user guide: "Each household supports up to 8 members, matching the available color palette. If you need more members, please contact support or wait for the custom color picker feature (coming soon)."

---

## 6. Firestore Security Rules

### Basic Security Rules

**Household Isolation:** Users can only read/write data within households they belong to. Rule: Check if households/{householdId}/members/{userId} exists.

**Role-Based Access:**

**Admin:** Full read/write on all household data. Can create/update/delete members. Can modify household settings (budgetCycleStartDay, budgets). Can manage devices.

**Member:** Read all household data. Write incomes/expenses only. Cannot modify household settings. Cannot create/delete members. Can only remove own devices.

### Security Rules Implementation

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isHouseholdMember(householdId) {
      return exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
    }
    
    function isHouseholdAdmin(householdId) {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && request.auth.uid == userId;
      allow create: if isAuthenticated() && 
        exists(/databases/$(database)/documents/households/$(request.resource.data.householdIds[0])/members/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/households/$(request.resource.data.householdIds[0])/members/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /households/{householdId} {
      allow read: if isHouseholdMember(householdId);
      allow write: if isHouseholdAdmin(householdId);
      
      match /members/{userId} {
        allow read: if isHouseholdMember(householdId);
        allow write: if isHouseholdAdmin(householdId);
      }
      
      match /devices/{deviceId} {
        allow read: if isHouseholdMember(householdId);
        allow create: if isHouseholdMember(householdId);
        allow delete: if isHouseholdAdmin(householdId) || 
          (isAuthenticated() && resource.data.userId == request.auth.uid);
      }
    }
  }
}
```

**Note:** No security rules needed for months, income, expenses, budgets because they're stored in SQLite only (never in Firestore).

**Left arrow button:** Navigate to previous month (disabled if on oldest month)

**Month dropdown:** Shows current month with date range. Display format: "October 2025 (25 Sep - 24 Oct)". Dropdown is searchable/scrollable list of all available months.

**Right button:** Arrow or + button (see logic below)

**Sync status:** Green/yellow/red/orange dot with status text (see Sync Status Indicator section)

### Navigation Button Logic

**Left Arrow ←:** Always present. Disabled if on oldest month. Enabled if previous month exists. Action: Navigate to previous month.

**Right Button → or +:**

| Scenario | Button | State | Action |
|----------|--------|-------|--------|
| Viewing previous month | → Arrow | Enabled | Navigate to next month |
| Viewing latest month, before budgetCycleStartDay | + Plus | Disabled | Tooltip: "Available on [date]" |
| Viewing latest month, on/after budgetCycleStartDay | + Plus | Enabled | Create next month |

**Examples** (budgetCycleStartDay = 25):

Sept 20, viewing October (latest): Left: ← (to September), Right: + (disabled, tooltip: "Available on 25 Oct 2025")

Sept 25, viewing October (latest): Left: ← (to September), Right: + (enabled, creates November)

Oct 10, viewing September (previous): Left: ← (disabled, oldest month), Right: → (to October)

### Historical Month Indicator

Orange warning tag displays when viewing any month before current month. Text: "⚠ Editing Historical Month". Visible on all screens within that month view.

### User Interface Elements

**Income/Expense Forms:**

**Date picker field:** If today's date falls within month's date range: default to today. If today is outside month's range: field is empty but required. User must manually select valid date if outside range. Validation: ensures selected date falls between month's startDate and endDate. Error message: "Date must be between [startDate] and [endDate]".

**User dropdown/selector:** For income: single user dropdown. For expense: multi-select for joint expenses.

**Name field:** Text input, 1-50 characters.

**Amount field:** Number input, stored as cents.

**Type/Category selector:** For income: salary/one_time. For expense: fixed/variable/incidental.

**Budget Group dropdown:** (for variable expenses only) - Shows list from budgets table for current month.

**Income/Expense Lists:** Each item shows user color circle(s). Single user: one colored circle. Joint expense: overlapping colored circles for each user. Deleted items are hidden from lists (excluded by deletedAt != null filter). Show date for each entry.

**Forms:** Income form: user (dropdown), name, amount, type (salary/one_time), date. Expense form: users (multi-select), name, amount, category, budgetGroup (if variable), date. All forms have "Save" button that immediately writes to SQLite and logs operation in sync_log.

### User Color Assignment (Admin Only)

**During User Creation:** Admin selects color from dropdown. Dropdown shows only available colors (used colors hidden). Color names displayed with visual preview (colored circle + text). Example: "🔵 Blue", "🟢 Green", "🟣 Purple".

**Validation:** If 8 members already exist with all colors assigned, show error: "All colors in use. Delete a member or upgrade color palette (future feature)." For MVP, 8-member limit acceptable for typical household size.

**Color Palette (8 options):**
1. Blue (#3B82F6)
2. Green (#10B981)
3. Pink (#EC4899)
4. Purple (#8B5CF6)
5. Yellow (#F59E0B)
6. Orange (#F97316)
7. Teal (#14B8A6)
8. Red (#EF4444)

### Household Settings (Admin Only)

**Budget Cycle Configuration:**

Field: "Budget Cycle Start Day". Input: Number selector (1-31). Help text: "Day of month when new budget period begins (e.g., 25 = budget runs from 25th to 24th). If day exceeds days in month (e.g., 31 in February), last day of month is used." Warning when changing: "This will affect future month calculations. Existing months remain unchanged."

### Budget Group Management (Admin Only)

**Location:** Within month view, accessible to admins

**Adding Budget Groups:**

**For New Months:** When creating next month via + button: Existing budget groups copy automatically from previous month. Admin can edit amounts before confirming creation. Admin can add new budget groups during setup. Admin can remove budget groups not needed.

**For Existing Months:** Admin can access "Manage Budgets" option within month view. Modal/screen shows list of current budget groups with amounts. Admin can: Add new budget group (name + amount). Edit existing budget amounts. Remove budget groups (see deletion rules).

**UI Flow - Add Budget Group:** Admin taps "Manage Budgets" in month view. List shows existing groups: Groceries (R3000), Petrol (R2000). Admin taps "+ Add Budget Group". Form appears: Budget Group Name: [text input], Amount: [number input, stored as cents]. Save → inserts into budgets table.

**Validation:** Budget group name: 1-30 characters, unique within month. Amount: positive number, max R999,999.99.

**Deleting Budget Groups:** See Budget Group Deletion section above for full validation logic.

**Roll-Forward Impact:** Deleted budget groups do NOT copy to future months when creating new months. Existing future months (already created) are NOT affected. Past months remain unchanged.

**Example:** October has budget groups: Groceries, Petrol, Power. Admin deletes "Petrol" from October (after removing/re-categorizing expenses). November is created → copies Groceries + Power only (no Petrol). September still has Petrol (if it existed there).

**Budget Independence:** Each month's budgets are independent snapshots. Editing budget amounts in October does NOT affect November's budgets (if November already exists). Only affects roll-forward when creating new months from the edited month.

---

## 13. Offline-First & Sync Strategy

### Offline Support

**SQLite Offline Persistence:** All data cached locally in SQLite. Queries return local data when offline. Writes saved to SQLite immediately. Operations logged in sync_log with synced=0.

### Conflict Resolution

**Strategy:** Last-Write-Wins (Accepted)

**Rationale:** Household members live together and can communicate. If two people edit same expense offline with different amounts, it's a communication issue, not technical issue. Typos can be fixed when discovered. Real conflicts resolved through household communication. MVP simplicity prioritized over complex conflict detection.

**Behavior:** User A edits "Rent" offline: R8000 → R8500 at 2:00 PM. User B edits same "Rent" offline: R8000 → R9000 at 2:05 PM. User A syncs at 2:10 PM → Other devices get R8500. User B syncs at 2:15 PM → Other devices get R9000 (overwrites A's change).

**Documented limitation:** Users should communicate about significant financial changes. Last edit always wins.

---

## 14. Development Milestones (MVP)

### Milestone 1 — Core Structure (~20-30 hrs)

- Vite + Svelte 5 + Capacitor setup
- Firebase Auth integration
- Cloud Function for user creation (or fallback approach)
- Firestore schema (top-level users, members subcollection, devices subcollection)
- SQLite initialization and schema creation
- Security rules with multi-household support
- Household selection flow (householdIds array approach)
- Household creation + bootstrap admin
- Household settings (budgetCycleStartDay configuration)
- Device registration on first launch

**Deliverable:** Multi-household structure working, auth flow complete, household selection on login, budget cycle configurable, device registration functional

---

### Milestone 2 — RTDB Sync Infrastructure (~24-34 hrs)

- Firebase RTDB initialization
- Sync queue upload logic
- Sync queue listener (process batches)
- Operation idempotency checks
- ACK logic (wait for all expected devices)
- Device management screen (user view)
- Device management screen (admin view)
- Device removal functionality
- Cloud Function for expired batch cleanup
- Sync log pruning task
- Sync status indicator UI

**Deliverable:** RTDB sync working, devices tracked, ACK logic prevents data loss, sync status visible to users

---

### Milestone 3 — Month & Entries (~28-40 hrs)

- Month CRUD with dynamic date calculation based on budgetCycleStartDay
- Current month identification logic
- Navigation button logic (arrow vs + button)
- + button enable/disable based on budgetCycleStartDay
- Income CRUD forms with date picker and validation
- Expense CRUD forms with date picker and validation
- Roll-forward logic (fixed expenses, budgets, salary incomes)
- Soft delete implementation
- Budget management (admin sets budgets in month)
- Budget group deletion with validation
- Date range validation for incomes/expenses
- Sync log integration (log all operations)

**Deliverable:** Months with custom cycles working, navigation polished, recurring data and budgets carried forward, date validation working, all operations logged for sync

---

### Milestone 4 — Dashboard & Calculations (~18-26 hrs)

- SQLite query setup for aggregations
- Client-side aggregation logic
- Budget progress calculations per budgetGroup
- Dashboard UI/layout with summary cards
- Expense breakdown visualization
- Real-time updates when data changes

**Deliverable:** Core financial summary works with real-time updates, scoped to current household, all calculations from local SQLite

---

### Milestone 5 — UI Polish & Navigation (~24-34 hrs)

- Month dropdown with date range display "October 2025 (25 Sep - 24 Oct)"
- Navigation button animations (arrow ↔ + transitions)
- User management screens (Admin only)
- Color assignment UI + visual indicators (colored circles)
- Historical month warning tag
- Form validation implementation (including date range validation)
- Offline sync testing and fixes
- Date picker components for income/expense forms
- Household switcher (if user belongs to multiple households)
- 8-member limit enforcement in UI

**Deliverable:** MVP complete, functional app with polished UX, custom budget cycles, and multi-household support

---

## 15. Time Estimate

**Total MVP Build: 114-164 hours**

- Best case (minimal debugging): ~114 hrs (~2.9 weeks full-time)
- Realistic (with learning curve): ~139 hrs (~3.5 weeks full-time)
- With iteration/debugging: ~164 hrs (~4.1 weeks full-time)

**Biggest effort areas:**
- RTDB sync infrastructure with ACK logic
- Device registration and management
- Multi-household data model + collection group queries
- SQLite CRUD integration + sync log
- Month roll-forward logic (fixed expenses, budgets, salary incomes)
- Dynamic date calculation based on budgetCycleStartDay
- Navigation button logic (arrow ↔ + transitions)
- Date range validation for incomes/expenses
- Budget tracking per budgetGroup
- Offline-first sync and conflict handling
- Budget cycle configuration UI
- Household selection/switching UI
- Sync status indicator

---

## 16. Example Dataset

```yaml
# SQLite (on each device)
users:
  user-dean:
    id: "user-dean"
    email: "dean@example.com"
    name: "Dean"
    householdIds: '["abc-123-def"]'
    createdAt: 1699887600000
    updatedAt: 1699887600000

  user-spouse:
    id: "user-spouse"
    email: "spouse@example.com"
    name: "Spouse"
    householdIds: '["abc-123-def"]'
    createdAt: 1699887600000
    updatedAt: 1699887600000

households:
  abc-123-def:
    id: "abc-123-def"
    name: "Smith Household"
    budgetCycleStartDay: 25
    createdAt: 1699887600000
    updatedAt: 1699887600000

household_members:
  - householdId: "abc-123-def"
    userId: "user-dean"
    role: "admin"
    color: "Blue"
    joinedAt: 1699887600000
    updatedAt: 1699887600000
  
  - householdId: "abc-123-def"
    userId: "user-spouse"
    role: "member"
    color: "Green"
    joinedAt: 1699887600000
    updatedAt: 1699887600000

device_info:
  device-dean-pixel:
    deviceId: "device-dean-pixel"
    deviceName: "Google Pixel 6"
    userId: "user-dean"
    lastActive: 1699887600000
    createdAt: 1699887600000

months:
  2025-10:
    id: "2025-10"
    householdId: "abc-123-def"
    startDate: "2025-09-25"
    endDate: "2025-10-24"
    createdAt: 1699887600000
    updatedAt: 1699887600000

budgets:
  - id: "budget-1"
    monthId: "2025-10"
    groupName: "Groceries"
    amount: 300000
    createdAt: 1699887600000
    updatedAt: 1699887600000
  
  - id: "budget-2"
    monthId: "2025-10"
    groupName: "Petrol"
    amount: 200000
    createdAt: 1699887600000
    updatedAt: 1699887600000
  
  - id: "budget-3"
    monthId: "2025-10"
    groupName: "Power"
    amount: 100000
    createdAt: 1699887600000
    updatedAt: 1699887600000

income:
  income-1:
    id: "income-1"
    monthId: "2025-10"
    userId: "user-dean"
    name: "Salary"
    amount: 2500000
    type: "salary"
    date: "2025-09-25"
    createdAt: 1699887600000
    updatedAt: 1699887600000
    createdBy: "user-dean"
    deletedAt: null
  
  income-2:
    id: "income-2"
    monthId: "2025-10"
    userId: "user-spouse"
    name: "Freelance Project"
    amount: 800000
    type: "one_time"
    date: "2025-10-05"
    createdAt: 1699887600000
    updatedAt: 1699887600000
    createdBy: "user-spouse"
    deletedAt: null

expenses:
  expense-1:
    id: "expense-1"
    monthId: "2025-10"
    userIds: '["user-dean", "user-spouse"]'
    name: "Rent"
    category: "fixed"
    budgetGroup: null
    amount: 850000
    date: "2025-10-01"
    createdAt: 1699887600000
    updatedAt: 1699887600000
    createdBy: "user-dean"
    deletedAt: null
  
  expense-2:
    id: "expense-2"
    monthId: "2025-10"
    userIds: '["user-spouse"]'
    name: "Checkers"
    category: "variable"
    budgetGroup: "Groceries"
    amount: 150000
    date: "2025-09-27"
    createdAt: 1699887600000
    updatedAt: 1699887600000
    createdBy: "user-spouse"
    deletedAt: null
  
  expense-3:
    id: "expense-3"
    monthId: "2025-10"
    userIds: '["user-dean"]'
    name: "Engen Petrol"
    category: "variable"
    budgetGroup: "Petrol"
    amount: 120000
    date: "2025-10-12"
    createdAt: 1699887600000
    updatedAt: 1699887600000
    createdBy: "user-dean"
    deletedAt: null
  
  expense-4:
    id: "expense-4"
    monthId: "2025-10"
    userIds: '["user-dean"]'
    name: "Car Repairs"
    category: "incidental"
    budgetGroup: null
    amount: 450000
    date: "2025-10-20"
    createdAt: 1699887600000
    updatedAt: 1699887600000
    createdBy: "user-dean"
    deletedAt: null

# Firestore (cloud - metadata only)
users/user-dean:
  email: "dean@example.com"
  name: "Dean"
  householdIds: ["abc-123-def"]
  createdAt: timestamp
  updatedAt: timestamp

users/user-spouse:
  email: "spouse@example.com"
  name: "Spouse"
  householdIds: ["abc-123-def"]
  createdAt: timestamp
  updatedAt: timestamp

households/abc-123-def:
  name: "Smith Household"
  budgetCycleStartDay: 25
  createdAt: timestamp

households/abc-123-def/members/user-dean:
  role: "admin"
  color: "Blue"
  joinedAt: timestamp
  updatedAt: timestamp

households/abc-123-def/members/user-spouse:
  role: "member"
  color: "Green"
  joinedAt: timestamp
  updatedAt: timestamp

households/abc-123-def/devices/device-dean-pixel:
  deviceId: "device-dean-pixel"
  deviceName: "Google Pixel 6"
  userId: "user-dean"
  lastActive: timestamp
  createdAt: timestamp

# RTDB (temporary sync queue - example batch)
sync_queue/abc-123-def/batch-uuid-123:
  deviceId: "device-dean-pixel"
  deviceName: "Google Pixel 6"
  operations:
    - id: "op-uuid-456"
      entityType: "expense"
      entityId: "expense-2"
      operation: "create"
      fieldName: null
      oldValue: null
      newValue: '{"id":"expense-2","monthId":"2025-10","userIds":["user-spouse"],"name":"Checkers","category":"variable","budgetGroup":"Groceries","amount":150000,"date":"2025-09-27","createdAt":1699887600000,"updatedAt":1699887600000,"createdBy":"user-spouse","deletedAt":null}'
      deviceId: "device-dean-pixel"
      deviceName: "Google Pixel 6"
      timestamp: 1699887600000
  timestamp: 1699887600000
  status: "pending"
  acks: {}
  expiresAt: 1700492400000
  expectedDevices: ["device-dean-pixel", "device-spouse-iphone"]
```

**Notes on Example:**
- Users are in both SQLite (local) and Firestore (metadata)
- Households metadata in both SQLite and Firestore
- Members stored in both (SQLite for offline, Firestore for discovery)
- Devices registered in both (SQLite for local ID, Firestore for ACK tracking)
- Financial data (months, budgets, income, expenses) ONLY in SQLite
- Amounts stored as cents (R2500000 = R25,000.00)
- Month ID uses YYYY-MM format (display label)
- October budget runs Sept 25 - Oct 24 (budgetCycleStartDay = 25)
- Salary date is Sept 25 but belongs to October budget
- Groceries purchased Sept 27 belong to October budget
- All dates fall within month's startDate/endDate range
- RTDB batch contains full expense object in newValue (temporarily)
- Joint expense (Rent) has multiple userIds
- Variable expenses reference budgetGroup
- All deletedAt fields are null (no deleted items shown)
- Batch will be deleted after device-spouse-iphone ACKs (or 7 days pass)

---

## 17. Future Enhancements

Features deferred post-MVP:

### Contract Income

Income type: contract with startPeriod and endPeriod fields. Automatically rolls forward only within the contract date range. Example: Consulting retainer from Sept 2025 to Nov 2025.

### Additional Roles

Dependent role: Limited permissions (view-only or restricted access). Permission granularity: Restrict members to edit only their own incomes/expenses.

### Privacy Controls

Hide specific incomes/expenses from certain users. Per-user budget visibility settings.

### Expense Split Percentages

For joint expenses, specify split (e.g., 40-60% between two users). Track individual contributions to shared expenses.

### Deleted Items Filter

Toggle to show/hide deleted incomes/expenses. Restore functionality for soft-deleted items. Cleaner UI when items are soft-deleted.

### Currency Selector

Household setting to choose currency (USD, EUR, GBP, ZAR, etc.). Multi-currency support with exchange rates.

### Automatic Backups

Periodic JSON export to cloud storage. Google Drive integration for backup/restore.

### Advanced Reporting

Year-over-year comparisons. Spending trends and forecasting. Export to CSV/Excel.

### Notifications

Budget threshold alerts (e.g., "80% of Groceries budget used"). Reminder to create next month. Monthly summary emails.

### Custom Color Picker

Allow unlimited users with hex color selection instead of preset palette. Removes 8-member household limit.

### End-to-End Encryption

Encrypt operation payloads in RTDB using household-derived key. Developer cannot see financial data even temporarily. Requires ~8-12 hours additional dev time.

---

## 18. Summary

### MVP Scope

✅ Multi-household support with users belonging to multiple households
✅ Household-based budgeting with Admin + Member roles
✅ Custom budget cycle based on configurable start day (default: 25th)
✅ Budget months span across calendar months (e.g., Sept 25 - Oct 24)
✅ Manual "Create Next Month" via + button (enabled on/after cycle start day)
✅ Smart navigation: arrow for previous months, + for creating next month
✅ Fixed incomes/expenses and budgets roll forward automatically
✅ Variable expenses tracked against budget groups
✅ All financial data stored locally in SQLite (never permanently in cloud)
✅ RTDB used as temporary sync relay (1-5 min typical, 7 days max)
✅ Device registration and management (user + admin views)
✅ Sync status indicator (online/offline/syncing/pending)
✅ Offline-first with automatic sync via RTDB
✅ Last-write-wins conflict resolution (accepted for MVP)
✅ Soft delete for all incomes/expenses
✅ Date tracking for all transactions with validation
✅ ZAR currency with cents storage
✅ 8-member household limit (matches color palette)

### Key Design Decisions

- **Local-first architecture:** All financial data in SQLite, never in Firestore
- **RTDB as sync relay:** Temporary queue (1-5 min), auto-deleted after all devices ACK
- **Multi-household architecture:** Users top-level, members subcollection
- **Device registration:** Track all devices for ACK logic
- **ACK before delete:** Batches stay until all expected devices acknowledge
- **Month ID format:** YYYY-MM string (references calendar month)
- **Month dates:** Calculated dynamically from budgetCycleStartDay
- **Real-time aggregation:** No manual calculate button, SQLite queries
- **Member permissions:** Can edit all data (granularity comes later)
- **Cloud Function:** Creates Auth accounts for new members + cleanup expired batches
- **Navigation logic:** Arrow ↔ + button based on latest month + cycle day
- **Budgets:** Managed by admin, roll forward like fixed expenses
- **Transaction dates:** Must fall within month's date range
- **Month display:** Shows date range: "October 2025 (25 Sep - 24 Oct)"
- **Conflict resolution:** Last-write-wins (household communication expected)
- **Sync log pruning:** Delete synced operations older than 6 months
- **Budget deletion:** Prevented if expenses reference the group

### Privacy Model

**What you (developer) can see:**
- Firestore: User emails, household names, membership, roles, colors, device names
- RTDB: Operations temporarily (1-5 min typical, 7 days max)

**What you CANNOT see:**
- Complete transaction history (on devices only)
- Historical financial data (on devices only)
- Budget details (on devices only)

**Legal exposure:** Minimal. No permanent financial data under your control. RTDB operations auto-deleted quickly.

### Time Estimate

114-164 hours (~2.9-4.1 weeks full-time)

---

## 19. Development Tasks

### Phase 1: Project Setup & Configuration

- 1.1. Initialize Vite project with Svelte 5 template - Done
- 1.2. Install Tailwind CSS 4 and configure CSS-based config - Done
- 1.3. Set up project folder structure (components, utils, lib) - Done
- 1.4. Set up JSDoc type definitions file for common types - Done
- 1.5. Install and configure SQLite plugin for Capacitor - Done
- 1.6. Initialize Capacitor and add Android platform - Done
- 1.7. Install required Capacitor plugins (@capacitor/app, @capacitor/preferences, @capacitor/device) - Done
- 1.8. Configure Capacitor for Android build - Done
- 1.9. Set up basic crud operation for testing. - Done
- 1.10. Install Firebase SDK (auth, firestore, database) and configure
- 1.11. Create Firebase project in console (enable Auth, Firestore, RTDB)
- 1.12. Set up Firebase config file with environment variables

### Phase 2: UI Design & Component Architecture

- 2.1. Design app color scheme and create Tailwind color tokens
- 2.2. Create base layout component structure (header, main, footer)
- 2.3. Design and document all screen layouts (wireframes/sketches)
- 2.4. List all required components (buttons, inputs, cards, modals, etc.)
- 2.5. Create base Button component with variants (primary, secondary, icon)
- 2.6. Create base Input component (text, number, date, dropdown)
- 2.7. Create Modal/Dialog component for forms
- 2.8. Create Card component for list items
- 2.9. Create Loading spinner component
- 2.10. Create Toast/notification component for feedback

### Phase 3: Authentication Foundation

- 3.1. Create Firebase Auth initialization service
- 3.2. Enable email/password authentication in Firebase Console
- 3.3. Create auth store using Svelte 5 runes ($state, $derived)
- 3.4. Build Login screen UI
- 3.5. Implement login form validation
- 3.6. Connect login form to Firebase Auth
- 3.7. Build "Set Password" screen for new members
- 3.8. Implement password setting functionality
- 3.9. Create auth state listener and persistence
- 3.10. Add logout functionality

### Phase 4: SQLite Schema & Initialization

- 4.1. Create SQLite initialization service
- 4.2. Write schema creation SQL for all tables
- 4.3. Create database migration system
- 4.4. Implement database open/close handlers
- 4.5. Create helper functions for CRUD operations (JSDoc annotated)
- 4.6. Test database creation and basic queries
- 4.7. Add error handling for database operations
- 4.8. Create indexes for common queries

### Phase 5: Firestore Schema & Security

- 5.1. Create Firestore initialization (no offline persistence - using SQLite)
- 5.2. Write security rules for users collection
- 5.3. Write security rules for households collection
- 5.4. Write security rules for members subcollection
- 5.5. Write security rules for devices subcollection
- 5.6. Deploy and test security rules in Firebase Console
- 5.7. Create helper functions for Firestore queries (JSDoc annotated)
- 5.8. Set up Firestore indexes for common queries

### Phase 6: Bootstrap Admin Setup

- 6.1. Document manual admin user creation steps in README
- 6.2. Create script/helper for generating admin user data
- 6.3. Manually create first admin user in Firebase Console
- 6.4. Manually create first household document
- 6.5. Manually create admin member document
- 6.6. Manually update admin user's householdIds array
- 6.7. Test admin login and verify household access
- 6.8. Document color palette constants in codebase
- 6.9. Sync Firestore metadata to SQLite on first login
- 6.10. Implement device registration on first launch

### Phase 7: Multi-Household User Flow

- 7.1. Create store for managing current household context
- 7.2. Build household selection screen UI
- 7.3. Implement householdIds query from user document on login
- 7.4. Create household card component for selection screen
- 7.5. Implement single household auto-navigation logic
- 7.6. Implement multi-household selection logic
- 7.7. Handle zero households error state
- 7.8. Add household switching functionality from dashboard
- 7.9. Store selected household in Capacitor Preferences
- 7.10. Restore last selected household on app restart
- 7.11. Sync household metadata to SQLite when switching

### Phase 8: Device Registration & Management

- 8.1. Implement device initialization on first launch
- 8.2. Generate and store unique deviceId in Preferences
- 8.3. Get device name from Capacitor Device plugin
- 8.4. Store device info in SQLite device_info table
- 8.5. Register device in Firestore households/{id}/devices
- 8.6. Update device lastActive timestamp on app open
- 8.7. Create device management screen (user view)
- 8.8. Display all user devices with last active time
- 8.9. Implement device removal (user can remove own devices)
- 8.10. Create device management screen (admin view)
- 8.11. Display all household devices grouped by user
- 8.12. Implement device removal (admin can remove any device)

### Phase 9: RTDB Sync Infrastructure

- 9.1. Initialize Firebase RTDB
- 9.2. Create sync queue upload function
- 9.3. Query active devices from Firestore before upload
- 9.4. Build batch object with operations, expectedDevices, expiresAt
- 9.5. Upload batch to RTDB sync_queue/{householdId}/{batchId}
- 9.6. Mark operations as synced in local sync_log
- 9.7. Create RTDB listener for sync_queue
- 9.8. Implement operation idempotency checks (check operation ID)
- 9.9. Apply operations to local SQLite (create/update/delete)
- 9.10. Record processed operations in sync_log
- 9.11. Send ACK to RTDB batch/acks/{deviceId}
- 9.12. Check if all expected devices ACK'd
- 9.13. Delete batch from RTDB when fully synced
- 9.14. Test sync between two devices
- 9.15. Handle offline/online transitions

### Phase 10: Cloud Functions

- 10.1. Initialize Firebase Functions project
- 10.2. Write Cloud Function to listen for new member documents
- 10.3. Implement Firebase Admin SDK user creation logic
- 10.4. Generate secure random temporary password
- 10.5. Send email with temporary password instructions (optional)
- 10.6. Deploy Cloud Function to Firebase
- 10.7. Test member creation end-to-end
- 10.8. Write Cloud Function for expired batch cleanup (6-hour schedule)
- 10.9. Query RTDB for batches where expiresAt < now
- 10.10. Delete expired batches
- 10.11. Deploy cleanup function
- 10.12. Test cleanup function manually

### Phase 11: Sync Status Indicator

- 11.1. Create syncStatus store with status and pendingCount
- 11.2. Implement updateSyncStatus function
- 11.3. Check navigator.onLine for network status
- 11.4. Query sync_log for unsynced operations count
- 11.5. Set status based on network + pending count
- 11.6. Add event listeners for online/offline events
- 11.7. Create sync status indicator UI component
- 11.8. Display colored dot with status text
- 11.9. Add tooltip/modal with sync details
- 11.10. Show last sync time and pending count
- 11.11. Add to navigation header

### Phase 12: Sync Log Pruning

- 12.1. Create pruneSyncLog function
- 12.2. Calculate sixMonthsAgo timestamp
- 12.3. Delete sync_log WHERE synced = 1 AND timestamp < sixMonthsAgo
- 12.4. Log number of pruned entries
- 12.5. Schedule to run monthly (30-day interval)
- 12.6. Run on app launch
- 12.7. Test pruning with old test data

### Phase 13: Household Settings & Member Management

- 13.1. Create Household Settings screen layout
- 13.2. Display household name and budgetCycleStartDay
- 13.3. Create edit household settings form (admin only)
- 13.4. Implement budgetCycleStartDay update with validation (1-31)
- 13.5. Create Member List component showing all members
- 13.6. Display member name, email, role, and color badge
- 13.7. Create "Add Member" form UI (admin only)
- 13.8. Implement add member validation (unique email, available color)
- 13.9. Check for 8-member limit
- 13.10. Create new user document in Firestore users/{newUserId}
- 13.11. Create member document in Firestore households/{id}/members/{userId}
- 13.12. Sync new member to SQLite
- 13.13. Update user's householdIds array
- 13.14. Implement member role editing (admin only)
- 13.15. Implement member color editing (admin only)
- 13.16. Add remove member functionality (admin only)

### Phase 14: Month Data Model & Utilities

- 14.1. Create month utility functions (JSDoc annotated)
- 14.2. Implement getCurrentMonth() function with date logic
- 14.3. Implement calculateMonthDates() from budgetCycleStartDay
- 14.4. Create formatMonthDisplay() for UI labels
- 14.5. Implement getLatestMonth() helper
- 14.6. Create isCurrentMonth() checker function
- 14.7. Implement canCreateNextMonth() logic
- 14.8. Create getNextMonthId() helper
- 14.9. Write unit tests for month utility functions
- 14.10. Handle edge cases (day 31 in February, etc.)

### Phase 15: Dashboard Foundation

- 15.1. Create Dashboard screen layout structure
- 15.2. Create month header component (navigation + dropdown)
- 15.3. Implement left arrow navigation (previous month)
- 15.4. Implement month dropdown with all available months
- 15.5. Implement right arrow/+ button conditional logic
- 15.6. Create month store for current month state
- 15.7. Query SQLite for current month data
- 15.8. Display month date range in header (e.g., "25 Sep - 24 Oct")
- 15.9. Show loading state while fetching month data
- 15.10. Handle missing month document gracefully

### Phase 16: Budget Groups Management

- 16.1. Create Budget Groups section UI on dashboard
- 16.2. Query budgets table for current month
- 16.3. Display budgets as list with amounts
- 16.4. Create "Add Budget Group" form (admin only)
- 16.5. Implement budget group creation with validation
- 16.6. Insert into budgets table
- 16.7. Log operation in sync_log
- 16.8. Create edit budget amount inline functionality
- 16.9. Implement budget amount update in SQLite
- 16.10. Log update operation in sync_log
- 16.11. Add delete budget group button (admin only)
- 16.12. Implement budget deletion with expense validation
- 16.13. Query expenses WHERE budgetGroup = groupName AND deletedAt IS NULL
- 16.14. Show error with expense count if validation fails
- 16.15. Delete from budgets table if validation passes
- 16.16. Log delete operation in sync_log
- 16.17. Format budget amounts with currency (R1,000.00)
- 16.18. Show budget remaining calculation next to each group

### Phase 17: Income Management

- 17.1. Create Income List component for dashboard
- 17.2. Query SQLite income table for current month
- 17.3. Display income items with name, amount, type, date, user
- 17.4. Show user color badge on income items
- 17.5. Create "Add Income" form modal
- 17.6. Build income form fields (name, amount, type, date, userId)
- 17.7. Implement income type dropdown (salary, one_time)
- 17.8. Add date picker with validation (within month range)
- 17.9. Implement amount input with cents conversion
- 17.10. Insert new income into SQLite
- 17.11. Log create operation in sync_log
- 17.12. Create "Edit Income" functionality
- 17.13. Update income in SQLite
- 17.14. Log update operation in sync_log
- 17.15. Implement soft delete for income (set deletedAt)
- 17.16. Log delete operation in sync_log
- 17.17. Filter out deleted incomes from display (WHERE deletedAt IS NULL)
- 17.18. Calculate and show total income sum on dashboard

### Phase 18: Expense Management

- 18.1. Create Expense List component for dashboard
- 18.2. Query SQLite expenses table for current month
- 18.3. Display expense items with name, amount, category, date, users
- 18.4. Parse userIds JSON array and show overlapping colored circles
- 18.5. Create "Add Expense" form modal
- 18.6. Build expense form fields (name, amount, category, budgetGroup, date, userIds)
- 18.7. Implement category dropdown (fixed, variable, incidental)
- 18.8. Conditionally show budget group dropdown (variable only)
- 18.9. Query budgets table for current month to populate dropdown
- 18.10. Implement multi-user selection for joint expenses
- 18.11. Add date picker with validation (within month range)
- 18.12. Insert new expense into SQLite (serialize userIds as JSON)
- 18.13. Log create operation in sync_log
- 18.14. Create "Edit Expense" functionality
- 18.15. Update expense in SQLite
- 18.16. Log update operation in sync_log
- 18.17. Implement soft delete for expense (set deletedAt)
- 18.18. Log delete operation in sync_log
- 18.19. Filter out deleted expenses from display (WHERE deletedAt IS NULL)
- 18.20. Calculate and show total expenses sum on dashboard

### Phase 19: Dashboard Aggregations

- 19.1. Calculate total income in real-time (SUM WHERE deletedAt IS NULL)
- 19.2. Calculate total expenses in real-time (SUM WHERE deletedAt IS NULL)
- 19.3. Calculate balance (income - expenses)
- 19.4. Calculate total budgeted amount (SUM budgets.amount)
- 19.5. Calculate expenses by category (GROUP BY category)
- 19.6. Calculate spending per budget group (GROUP BY budgetGroup)
- 19.7. Calculate remaining budget per group (budget - spent)
- 19.8. Show progress bars for budget groups
- 19.9. Highlight over-budget groups in red
- 19.10. Display all aggregations in dashboard summary card

### Phase 20: Create Next Month Logic

- 20.1. Implement "Create Next Month" button click handler
- 20.2. Validate budgetCycleStartDay has passed
- 20.3. Validate next month doesn't already exist
- 20.4. Calculate next month's startDate and endDate
- 20.5. Insert new month into SQLite months table
- 20.6. Copy budgets from previous month
- 20.7. Query salary-type incomes (type="salary", deletedAt IS NULL)
- 20.8. Insert copied salary incomes to new month
- 20.9. Query fixed expenses (category="fixed", deletedAt IS NULL)
- 20.10. Insert copied fixed expenses to new month
- 20.11. Log all copy operations in sync_log
- 20.12. Navigate to newly created month
- 20.13. Show success notification
- 20.14. Update navigation buttons after creation
- 20.15. Test roll-forward with various scenarios

### Phase 21: Navigation & State Management

- 21.1. Implement state-based navigation system (no router)
- 21.2. Create navigation store with current screen state
- 21.3. Create Screen enum/constants (Login, Dashboard, Settings, etc.)
- 21.4. Implement navigation helper functions (navigateTo, goBack)
- 21.5. Handle Android back button with Capacitor App plugin
- 21.6. Create navigation history stack for back navigation
- 21.7. Implement deep state for nested views (e.g., edit forms)
- 21.8. Persist navigation state in Capacitor Preferences
- 21.9. Restore navigation state on app restart
- 21.10. Handle logout and reset navigation state

### Phase 22: Validation & Error Handling

- 22.1. Create validation utility functions (JSDoc annotated)
- 22.2. Implement amount field validation (positive, max 1B cents)
- 22.3. Implement name field validation (1-50 chars, non-empty)
- 22.4. Implement email validation (valid format, no duplicates)
- 22.5. Implement date validation (within month range)
- 22.6. Implement budgetCycleStartDay validation (1-31)
- 22.7. Add validation error messages to form fields
- 22.8. Implement SQLite error handling with user-friendly messages
- 22.9. Add try-catch blocks to all async operations
- 22.10. Show error toasts for failed operations
- 22.11. Log errors to console for debugging
- 22.12. Handle offline state errors gracefully

### Phase 23: Offline-First & Sync Testing

- 23.1. Test app functionality with network disabled
- 23.2. Verify all CRUD operations work offline
- 23.3. Verify sync_log records operations
- 23.4. Test sync when coming back online
- 23.5. Test RTDB batch upload
- 23.6. Test operation processing on receiving device
- 23.7. Test ACK logic with multiple devices
- 23.8. Test conflict resolution (last-write-wins)
- 23.9. Test device removal impact on ACK logic
- 23.10. Test expired batch cleanup
- 23.11. Test sync status indicator updates
- 23.12. Test sync log pruning

### Phase 24: Historical Month Editing

- 24.1. Add visual warning indicator for past months
- 24.2. Implement getCurrentMonth() to identify current vs historical
- 24.3. Show "⚠ Editing Historical Month" banner when not on current month
- 24.4. Allow full edit access to past month incomes/expenses
- 24.5. Allow full edit access to past month budgets (admin)
- 24.6. Test that editing past months doesn't affect future months
- 24.7. Verify budget independence between months

### Phase 25: Currency Formatting & Display

- 25.1. Create currency formatting utility function
- 25.2. Implement formatCurrency() with ZAR symbol (R)
- 25.3. Add thousands separators (1,000.00)
- 25.4. Always show 2 decimal places
- 25.5. Handle negative amounts (expenses as positive display)
- 25.6. Apply currency formatting to all amount displays
- 25.7. Create parseCurrency() for input conversion
- 25.8. Convert user input (R25.50) to cents (2550)
- 25.9. Test currency conversion edge cases
- 25.10. Document currency handling in developer docs

### Phase 26: Android Build & Testing

- 26.1. Generate Android app icons and splash screen
- 26.2. Configure app name and package ID in Capacitor config
- 26.3. Build Svelte app for production (npm run build)
- 26.4. Sync Capacitor assets (npx cap sync android)
- 26.5. Open Android project in Android Studio
- 26.6. Test app on Android emulator
- 26.7. Test app on physical Android device
- 26.8. Test back button navigation on Android
- 26.9. Test app lifecycle (pause/resume) on Android
- 26.10. Generate signed APK for distribution
- 26.11. Test installed APK on device

### Phase 27: Comprehensive Testing

- 27.1. Test complete admin bootstrap flow
- 27.2. Test member creation and password setup flow
- 27.3. Test multi-household user login and switching
- 27.4. Test single household auto-navigation
- 27.5. Test household settings updates (budgetCycleStartDay)
- 27.6. Test device registration and management
- 27.7. Test month creation with various cycle start days (1, 15, 25, 31)
- 27.8. Test month navigation (arrows, dropdown)
- 27.9. Test income creation for both types (salary, one_time)
- 27.10. Test expense creation for all categories (fixed, variable, incidental)
- 27.11. Test joint expense with multiple users
- 27.12. Test budget group creation, editing, and deletion
- 27.13. Test budget group deletion validation (with expenses)
- 27.14. Test soft delete and hidden display of incomes/expenses
- 27.15. Test roll-forward logic (salary incomes + fixed expenses)
- 27.16. Test that variable/incidental don't roll forward
- 27.17. Test dashboard aggregations accuracy
- 27.18. Test budget progress calculations
- 27.19. Test offline functionality (create, edit, delete)
- 27.20. Test RTDB sync between multiple devices
- 27.21. Test ACK logic and batch deletion
- 27.22. Test device removal impact on sync
- 27.23. Test sync after coming back online
- 27.24. Test Firestore security rules (unauthorized access)
- 27.25. Test edge cases (day 31 in February, leap years)
- 27.26. Test 8-member limit enforcement

### Phase 28: UI Polish & UX Improvements

- 28.1. Add loading skeletons for async data
- 28.2. Add smooth transitions between screens
- 28.3. Improve form validation feedback (real-time)
- 28.4. Add confirmation dialogs for destructive actions
- 28.5. Improve empty states (no income, no expenses, no budgets)
- 28.6. Add pull-to-refresh on dashboard
- 28.7. Optimize list rendering for large datasets
- 28.8. Add sorting options for incomes/expenses (date, amount, name)
- 28.9. Improve touch targets for mobile (min 44x44px)
- 28.10. Test accessibility (color contrast, text size)
- 28.11. Add haptic feedback for button presses (optional)
- 28.12. Polish animations and transitions

### Phase 29: Documentation & Deployment

- 29.1. Write comprehensive README with setup instructions
- 29.2. Document Firebase project setup steps
- 29.3. Document environment variables configuration
- 29.4. Document admin bootstrap process
- 29.5. Create user guide for app features
- 29.6. Document Cloud Function deployment
- 29.7. Document Firestore security rules deployment
- 29.8. Document RTDB security rules (if needed)
- 29.9. Create developer documentation for codebase
- 29.10. Document sync architecture and flow
- 29.11. Document common troubleshooting issues
- 29.12. Create release notes for MVP version
- 29.13. Deploy production Firebase project
- 29.14. Deploy Cloud Functions to production
- 29.15. Test production deployment end-to-end

---

**END OF SPECIFICATION**
