# TapVelocity — Setup Guide

A high-intensity reaction game where users tap a button as many times as possible in 10 seconds, with real-time global leaderboard rankings.

---

## Prerequisites

| Tool        | Version   | Install                                                 |
| ----------- | --------- | ------------------------------------------------------- |
| Node.js     | ≥ 18      | [nodejs.org](https://nodejs.org/)                       |
| npm         | ≥ 9       | Ships with Node.js                                      |
| PostgreSQL  | ≥ 14      | [postgresql.org](https://www.postgresql.org/download/)   |
| Expo CLI    | latest    | `npm install -g expo-cli` *(optional — npx works too)*  |

---

## Repository Structure

```
tapvelocity/
├── server/          # Backend — Fastify + Mercurius (GraphQL) + Prisma
├── tapvelocity/     # Mobile app — React Native + Expo Router
└── plans/           # Implementation plan & design docs
```

---

## 1. Database Setup

1. **Start PostgreSQL** and make sure it is running on `localhost:5432`.

2. **Create the database:**

   ```sql
   CREATE DATABASE tapvelocity;
   ```

   Or via the command line:

   ```bash
   createdb tapvelocity
   ```

> If you prefer Docker, you can spin up PostgreSQL with:
>
> ```bash
> docker run -d --name tapvelocity-db \
>   -e POSTGRES_USER=postgres \
>   -e POSTGRES_PASSWORD=postgres \
>   -e POSTGRES_DB=tapvelocity \
>   -p 5432:5432 \
>   postgres:16-alpine
> ```

---

## 2. Server Setup

```bash
cd server
npm install
```

### 2.1 Environment Variables

Copy the example file and adjust values if needed:

```bash
cp .env.example .env
```

Default `.env` contents:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tapvelocity

# Server
PORT=4000
NODE_ENV=development
```

Update `DATABASE_URL` if your PostgreSQL credentials or port differ.

### 2.2 Run Database Migrations

Generate the Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

> You can inspect the database visually with **Prisma Studio**:
>
> ```bash
> npm run db:studio
> ```

### 2.3 Start the Dev Server

```bash
npm run dev
```

The server starts at **http://localhost:4000** with:

| Endpoint                          | Description                |
| --------------------------------- | -------------------------- |
| `GET  /health`                    | Health check               |
| `POST /graphql`                   | GraphQL API                |
| `GET  /graphiql`                  | GraphiQL IDE (dev only)    |

### 2.4 Verify It Works

```bash
# Health check
curl http://localhost:4000/health

# GraphQL query
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ leaderboard(limit: 5) { rank tapCount user { username } } }"}'
```

---

## 3. Mobile App Setup

```bash
cd tapvelocity
npm install
```

### 3.1 Start Expo

```bash
npm start
```

This launches the Expo dev server. From there you can:

- Press **`a`** to open on an Android emulator / device
- Press **`i`** to open on an iOS simulator (macOS only)
- Press **`w`** to open in a web browser
- Scan the QR code with the **Expo Go** app on a physical device

### 3.2 Platform-Specific Commands

```bash
npm run android   # start on Android
npm run ios       # start on iOS (macOS only)
npm run web       # start for web
```

---

## 4. GraphQL API Reference

### Queries

| Query                              | Description                                    |
| ---------------------------------- | ---------------------------------------------- |
| `leaderboard(limit: Int = 10)`     | Top players by best tap count                  |
| `user(id: ID!)`                    | Fetch a user by ID                             |
| `userByUsername(username: String!)` | Fetch a user by username                       |
| `userGames(userId: ID!, limit: Int = 20)` | Recent games for a user                 |

### Mutations

| Mutation                                | Description                                  |
| --------------------------------------- | -------------------------------------------- |
| `createUser(username: String!)`         | Register a new user                          |
| `submitGame(userId: ID!, tapCount: Int!)` | Submit a game result; computes percentile  |

### Example: Create a User and Submit a Game

```graphql
# 1. Create a user
mutation {
  createUser(username: "speedster") {
    id
    username
  }
}

# 2. Submit a game (use the returned user ID)
mutation {
  submitGame(userId: "<USER_ID>", tapCount: 87) {
    id
    tapCount
    percentile
    user { username }
  }
}

# 3. Check the leaderboard
query {
  leaderboard(limit: 10) {
    rank
    tapCount
    percentile
    user { username }
  }
}
```

---

## 5. Available Scripts

### Server (`server/`)

| Script           | Command                  | Description                        |
| ---------------- | ------------------------ | ---------------------------------- |
| `npm run dev`    | `tsx watch src/index.ts` | Start dev server with hot reload   |
| `npm run build`  | `tsc`                    | Compile TypeScript to `dist/`      |
| `npm start`      | `node dist/index.js`     | Run production build               |
| `npm run db:generate` | `prisma generate`   | Regenerate Prisma client           |
| `npm run db:migrate`  | `prisma migrate dev`| Run pending migrations             |
| `npm run db:studio`   | `prisma studio`     | Open Prisma Studio GUI             |
| `npm run db:push`     | `prisma db push`    | Push schema changes (no migration) |
| `npm run db:seed`     | `tsx prisma/seed.ts`| Seed the database                  |

### Mobile App (`tapvelocity/`)

| Script           | Command              | Description                   |
| ---------------- | -------------------- | ----------------------------- |
| `npm start`      | `expo start`         | Start Expo dev server         |
| `npm run android`| `expo start --android` | Launch on Android           |
| `npm run ios`    | `expo start --ios`   | Launch on iOS                 |
| `npm run web`    | `expo start --web`   | Launch in browser             |
| `npm run lint`   | `expo lint`          | Run ESLint                    |

---

## 6. Tech Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Mobile     | React Native, Expo SDK 54, Expo Router         |
| Backend    | Fastify 5, Mercurius (GraphQL), Prisma ORM     |
| Database   | PostgreSQL                                     |
| Language   | TypeScript                                     |

---

## Troubleshooting

| Problem                         | Solution                                                         |
| ------------------------------- | ---------------------------------------------------------------- |
| `prisma: command not found`     | Run `npx prisma ...` or install globally: `npm i -g prisma`     |
| DB connection refused           | Make sure PostgreSQL is running and `DATABASE_URL` is correct    |
| Port 4000 in use                | Change `PORT` in `.env` or kill the other process                |
| Expo QR code won't scan         | Ensure your phone and computer are on the same Wi-Fi network     |
| Module not found errors         | Delete `node_modules` and run `npm install` again                |
