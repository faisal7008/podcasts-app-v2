import { pgTable, text, timestamp, boolean, integer, numeric, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()), // Should be updated manually or via trigger
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

export const userProfile = pgTable("UserProfile", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique(),
  displayName: text("displayName"),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

export const userPreferences = pgTable("UserPreferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique(),
  theme: text("theme").notNull().default("system"),
  playbackSpeed: numeric("playbackSpeed", { precision: 3, scale: 2 }).notNull().default("1.00"),
  autoDownload: boolean("autoDownload").notNull().default(false),
  notificationsEnabled: boolean("notificationsEnabled").notNull().default(true),
});

export const follow = pgTable("Follow", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  podcastId: text("podcastId").notNull(),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
}, (t) => [
  uniqueIndex("Follow_userId_podcastId_key").on(t.userId, t.podcastId)
]);

export const playHistory = pgTable("PlayHistory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  episodeId: text("episodeId").notNull(),
  podcastId: text("podcastId").notNull(),
  progressSeconds: integer("progressSeconds").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  playedAt: timestamp("playedAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
}, (t) => [
  uniqueIndex("PlayHistory_userId_episodeId_key").on(t.userId, t.episodeId)
]);

export const like = pgTable("Like", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  episodeId: text("episodeId").notNull(),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
}, (t) => [
  uniqueIndex("Like_userId_episodeId_key").on(t.userId, t.episodeId)
]);

// ─── Studio Tables ──────────────────────────────────────────────────────

export const podcast = pgTable("Podcast", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  author: text("author"),
  artwork: text("artwork"),
  category: text("category"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

export const episode = pgTable("Episode", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  podcastId: text("podcastId").notNull().references(() => podcast.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  number: integer("number"),
  title: text("title").notNull(),
  description: text("description"),
  datePublished: timestamp("datePublished").notNull().$defaultFn(() => new Date()),
  artwork: text("artwork"),
  duration: integer("duration").default(0),
  audioUrl: text("audioUrl").notNull(),
  fileSizeBytes: integer("fileSizeBytes").default(0),
  mimeType: text("mimeType"),
  status: text("status").notNull().default("draft"),
  waveformData: text("waveformData"),
  transcript: text("transcript"),
  aiSummary: text("aiSummary"),
  chapters: text("chapters"),
  showNotes: text("showNotes"),
  tags: text("tags"),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

export const job = pgTable("Job", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  episodeId: text("episodeId").notNull().references(() => episode.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("full_pipeline"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  error: text("error"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});
