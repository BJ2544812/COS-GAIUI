// Load `.env` with same rules as the API (see src/server/utils/loadEnv.ts).
import "./src/server/utils/loadEnv.ts";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
