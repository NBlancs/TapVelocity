import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const SEED_USERS = [
  { username: 'TurboTapper', tapCount: 92 },
  { username: 'BlitzFinger', tapCount: 85 },
  { username: 'SonicClick', tapCount: 78 },
  { username: 'ApexPointer', tapCount: 71 },
  { username: 'HyperFlex', tapCount: 63 },
];

async function main() {
  console.log('Seeding leaderboard...');

  // Clean up existing seed data if present to make seed re-runnable
  for (const seed of SEED_USERS) {
    const existingUser = await prisma.user.findUnique({
      where: { username: seed.username },
    });
    if (existingUser) {
      // Cascade delete will delete associated games
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
      console.log(`Removed existing seed user: ${seed.username}`);
    }
  }

  // Insert seed users and their games in order
  for (const seed of SEED_USERS) {
    const user = await prisma.user.create({
      data: {
        username: seed.username,
        passwordHash: hashPassword('password123'),
      },
    });

    // Calculate percentile using the same logic as submitGame
    const [stats] = await prisma.$queryRaw<{ total: bigint; beaten: bigint }[]>`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE "tapCount" <= ${seed.tapCount})::bigint AS beaten
      FROM "Game"
    `;

    const total = Number(stats?.total || 0);
    const beaten = Number(stats?.beaten || 0);
    const percentile = total === 0 ? 100 : Math.round((beaten / (total + 1)) * 10000) / 100;

    await prisma.game.create({
      data: {
        userId: user.id,
        tapCount: seed.tapCount,
        percentile,
      },
    });

    console.log(`Created user ${seed.username} with game score ${seed.tapCount} (Percentile: ${percentile}%)`);
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
