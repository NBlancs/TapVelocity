export const schema = /* GraphQL */ `
  type User {
    id: ID!
    username: String!
    createdAt: String!
    games: [Game!]!
  }

  type Game {
    id: ID!
    user: User!
    tapCount: Int!
    duration: Int!
    percentile: Float
    createdAt: String!
  }

  type LeaderboardEntry {
    rank: Int!
    user: User!
    tapCount: Int!
    percentile: Float!
  }

  type Query {
    """Fetch the top players, ordered by tap count descending."""
    leaderboard(limit: Int = 10): [LeaderboardEntry!]!

    """Fetch a single user by ID."""
    user(id: ID!): User

    """Fetch a user by username."""
    userByUsername(username: String!): User

    """Fetch all games for a given user, most recent first."""
    userGames(userId: ID!, limit: Int = 20): [Game!]!
  }

  type Mutation {
    """Create a new user with a unique username."""
    createUser(username: String!): User!

    """Submit a completed game and compute the player's percentile."""
    submitGame(userId: ID!, tapCount: Int!): Game!
  }
`;
