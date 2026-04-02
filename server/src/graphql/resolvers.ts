import prisma from "../lib/prisma.js";

export const resolvers = {
  Query: {
    leaderboard: async (_root: unknown, { limit = 10 }: { limit?: number }) => {
      // Get each user's best game, ranked by tap count descending
      const bestGames = await prisma.$queryRaw<
        { id: string; userId: string; tapCount: number; percentile: number; rank: number }[]
      >`
        WITH best_games AS (
          SELECT DISTINCT ON ("userId")
            "id", "userId", "tapCount", "percentile"
          FROM "Game"
          ORDER BY "userId", "tapCount" DESC
        ),
        ranked AS (
          SELECT
            *,
            ROW_NUMBER() OVER (ORDER BY "tapCount" DESC) AS rank
          FROM best_games
        )
        SELECT * FROM ranked
        ORDER BY rank ASC
        LIMIT ${limit}
      `;

      // Hydrate user relations
      const userIds = bestGames.map((g) => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      return bestGames.map((g) => ({
        rank: Number(g.rank),
        user: userMap.get(g.userId),
        tapCount: g.tapCount,
        percentile: g.percentile ?? 0,
      }));
    },

    user: async (_root: unknown, { id }: { id: string }) => {
      return prisma.user.findUnique({ where: { id } });
    },

    userByUsername: async (_root: unknown, { username }: { username: string }) => {
      return prisma.user.findUnique({ where: { username } });
    },

    userGames: async (_root: unknown, { userId, limit = 20 }: { userId: string; limit?: number }) => {
      return prisma.game.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { user: true },
      });
    },
  },

  Mutation: {
    createUser: async (_root: unknown, { username }: { username: string }) => {
      return prisma.user.create({
        data: { username },
      });
    },

    submitGame: async (
      _root: unknown,
      { userId, tapCount }: { userId: string; tapCount: number },
      ctx: any
    ) => {
      // Calculate percentile: percentage of games this score beats
      const [stats] = await prisma.$queryRaw<{ total: bigint; beaten: bigint }[]>`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE "tapCount" <= ${tapCount})::bigint AS beaten
        FROM "Game"
      `;

      const total = Number(stats.total);
      const beaten = Number(stats.beaten);
      // If no prior games, this is the first — 100th percentile
      const percentile = total === 0 ? 100 : Math.round((beaten / (total + 1)) * 10000) / 100;

      const game = await prisma.game.create({
        data: {
          userId,
          tapCount,
          percentile,
        },
        include: { user: true },
      });

      ctx.pubsub.publish({
        topic: "LEADERBOARD_UPDATED",
        payload: true,
      });

      return game;
    },
  },

  Subscription: {
    leaderboardUpdated: {
      subscribe: async (
        _root: unknown,
        _args: unknown,
        ctx: any
      ) => {
        return ctx.pubsub.subscribe("LEADERBOARD_UPDATED");
      },
      resolve: () => true,
    },
  },

  // Field resolvers for nested types
  User: {
    createdAt: (user: { createdAt: Date }) => user.createdAt.toISOString(),
    games: async (user: { id: string }) => {
      return prisma.game.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Game: {
    createdAt: (game: { createdAt: Date }) => game.createdAt.toISOString(),
    user: async (game: { userId: string }) => {
      return prisma.user.findUnique({ where: { id: game.userId } });
    },
  },
};
