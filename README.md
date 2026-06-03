# TapVelocity

TapVelocity is a full-stack reaction game where players tap as fast as possible for 10 seconds and compare scores on a global leaderboard.

## Current Version

- Mobile app (`tapvelocity/package.json` and `tapvelocity/app.json`): `1.0.0`
- Backend API (`server/package.json`): `1.0.0`
- Last verified: `2026-04-02`

This repository contains:

- A GraphQL backend (`server/`) built with Fastify, Mercurius, Prisma, and PostgreSQL
- A mobile app (`tapvelocity/`) built with React Native and Expo Router

## Repository Structure

```text
tapvelocity/
├── server/       # Backend API and database layer
├── tapvelocity/  # Expo mobile app
├── plans/        # Planning docs (optional for runtime)
├── SETUP.md      # Detailed setup walkthrough
└── README.md
```

## Tech Stack

- Mobile: React Native, Expo SDK 54, Expo Router, Apollo Client, Zustand, Expo Audio
- Backend: Fastify 5, Mercurius (GraphQL), Prisma
- Database: PostgreSQL
- Language: TypeScript

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Quick Start

For full setup details (database creation, env vars, validation), see `SETUP.md`.

### 1) Start the backend

```bash
cd server
npm install
npm run db:generate
npm run db:migrate
npm run db:seed     # Seed 5 players for the leaderboard
npm run dev
```

Backend endpoints:

- `http://localhost:4000/health`
- `http://localhost:4000/graphql`
- `http://localhost:4000/graphiql` (development only)

### 2) Start the mobile app

In a new terminal:

```bash
cd tapvelocity
npm install
npm start
```

Useful Expo commands:

- `npm run android`
- `npm run ios` (macOS only)
- `npm run web`

## Key Features

### Dynamic Server Discovery & Configuration
To support production APK/standalone builds connecting to a local laptop backend, the app has a dedicated **Server Configuration** settings sheet:
- **Parallel Subnet Scanning**: Automatically scans 9 common subnets in parallel (~2,286 IPs concurrently) with a `2500ms` timeout to locate your laptop's server.
- **Manual URL Input**: Allows entering a custom URL/IP.
- **URL Normalization**: Normalizes inputs (e.g. typing `192.168.1.57` auto-completes to `http://192.168.1.57:4000/graphql`).
- **Health Validation**: Probes the server health check (`/health` with a `4000ms` timeout) before saving.

### Dynamic Audio System
The app features customized sound mechanics powered by `expo-audio`:
- **Main Menu**: Looping ambient background music (`game_bg.mp3`).
- **Countdown**: High-fidelity countdown sound (`countdown.mp3`) before gameplay.
- **Singleplayer**: Immersive sword slashing sound effects (`slash.mp3`) on every button tap (using rapid-fire overlapping sound pools).
- **Multiplayer**: High-intensity background music (`multiplayer_bg.mp3`) during duo matches.
- **Game Over**: Game completion buzzer sound (`buzzer.mp3`).
- **Volume Settings**: A new Settings tab allows adjusting music and SFX volumes individually (stored in a persisted Zustand store, defaulting to 50%).

### Singleplayer Boss Battles
Singleplayer mode features progression-based boss fights:
- **Interactive Boss Arena**: Tap to attack and defeat three unique bosses (Gorgon with 40 HP, Behemoth with 80 HP, Shadow Dragon with 120 HP) within the 10-second timer.
- **Damage & Defeat Visuals**: Every tap triggers a quick monster damage frame transition and spawns a floating `-1` damage indicator that floats up and fades out at the tap coordinate.
- **Defeat Holds & Transitions**: Defeating a boss locks the image to a defeated state for 500ms, plays a defeat haptic notification / buzzer, and dynamically transitions to the next boss.
- **Centered Slash Targeting**: Uses absolute screen coordinates relative to the monster to center the sword slash animations perfectly on the active boss's body.

### Persistent Leveling System
A gaming progress framework tied directly to player activity:
- **Cumulative Progress**: Taps from singleplayer and multiplayer matches are persistently accumulated via AsyncStorage.
- **Evolving Level Badges**: Levels range from 1 to 6 (Novice ➡️ Apprentice ➡️ Warrior ➡️ Veteran ➡️ Master ➡️ Grandmaster).
- **Interactive Level Up Modals**: Displays a level up modal celebrating new titles and level progress upon completion of a match.
- **Home Screen HUD**: Displays active title, level, and a styled progress bar towards the next level directly below the player's username handle. Max levels showcase a crowns badge.

## GraphQL API Summary

### Queries

- `leaderboard(limit: Int = 10)`
- `user(id: ID!)`
- `userByUsername(username: String!)`
- `userGames(userId: ID!, limit: Int = 20)`

### Mutations

- `createUser(username: String!)`
- `submitGame(userId: ID!, tapCount: Int!)`

## Scripts

### Backend (`server/`)

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed the database with 5 players
- `npm run db:studio` - Open Prisma Studio

### Mobile (`tapvelocity/`)

- `npm start` - Start Expo dev server
- `npm run android` - Open Android target
- `npm run ios` - Open iOS target
- `npm run web` - Run web target
- `npm run lint` - Run lint checks

## Development Notes

- Make sure to seed the database (`npm run db:seed`) so the leaderboard doesn't look empty when first launching the app.
- When packaging the standalone APK via EAS, use the **Configure Server** option on the username screen to dynamically scan and connect to your laptop's backend over local Wi-Fi.

## Troubleshooting

- Database connection errors: verify PostgreSQL is running and `DATABASE_URL` is valid.
- Port conflicts on `4000`: set a different `PORT` in backend environment variables.
- Expo issues: clear cache with `npx expo start --clear`.
- Dependency issues: remove `node_modules` and reinstall with `npm install`.
