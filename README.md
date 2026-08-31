# Budgit

A household budget tracker for tracking income and expenses, comparing them against monthly budgets, and visualizing spending through analytics. Built with SvelteKit and Capacitor, using local SQLite storage.

## Features

- **Households & members** – multiple users can belong to a household, each assigned a role and colour
- **Monthly cycles** – budgets and transactions are scoped to custom monthly periods with a configurable start day
- **Budgets by group** – set spending limits per budget group (e.g. groceries, transport) for each month
- **Transactions** – track income (salary, one-time, interest) and expenses (fixed, variable, incidental), linked to a budget group where relevant
- **Budget thresholds** – configurable warning (default 75%) and danger (default 90%) thresholds to flag overspending
- **Analytics** – compare total income vs expenses, and track budget usage per group, per month
- **Device tracking** – tracks last active device for sync/backup purposes
- **Backups** – logs backup events with type, location, and affected households

## Stack

- **SvelteKit** – app framework
- **Tailwind CSS** – styling
- **Capacitor** – native mobile runtime (Android)
- **@capacitor-community/sqlite** – local database storage
- **@capacitor/filesystem** + **@capawesome/capacitor-file-picker** – file import/export
- **@capacitor/preferences** – local key-value storage
- **@capacitor/haptics** – tactile feedback
- **@capawesome/capacitor-android-edge-to-edge-support** – edge-to-edge Android UI

## Getting started

```bash
npm install
```

## Developing

```bash
npm run dev

# or open in browser automatically
npm run dev -- --open
```

## Building

```bash
npm run build
npm run preview
```

## Mobile (Android)

```bash
npx cap sync android
npx cap open android
```

## Code quality

```bash
npm run check       # type checking
npm run format       # format with Prettier
npm run lint         # check formatting
```
