# TapVelocity

TapVelocity is a full-stack reaction game where players tap as fast as possible for 10 seconds and compare scores on a global leaderboard.

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

- Mobile: React Native, Expo SDK 54, Expo Router, Apollo Client, Zustand
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
- `npm run db:studio` - Open Prisma Studio

### Mobile (`tapvelocity/`)

- `npm start` - Start Expo dev server
- `npm run android` - Open Android target
- `npm run ios` - Open iOS target
- `npm run web` - Run web target
- `npm run lint` - Run lint checks

## Development Notes

- Keep the backend running before launching the app to ensure leaderboard and submit flows work.
- If your API URL changes, update the Apollo client configuration in `tapvelocity/lib/apollo.ts`.
- The `plans/` folder is documentation and can be excluded from commits if desired.

## Troubleshooting

- Database connection errors: verify PostgreSQL is running and `DATABASE_URL` is valid.
- Port conflicts on `4000`: set a different `PORT` in backend environment variables.
- Expo issues: clear cache with `npx expo start --clear`.
- Dependency issues: remove `node_modules` and reinstall with `npm install`.
