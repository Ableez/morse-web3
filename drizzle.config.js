/** @type { import("drizzle-kit").Config } */

const cfg = {
  schema: "./src/server/db/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["weirdgee_*"],
  out: "/drizzle",
};

export default cfg;
