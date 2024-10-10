/** @type { import("drizzle-kit").Config } */

const cfg = {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["morseacad_*"],
  out: "./drizzle",
};

export default cfg;
