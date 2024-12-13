import postgres from "postgres";

import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
import { defineConfig } from "@snaplet/seed/config";

export default defineConfig({
  adapter: () => {
    const client = postgres(
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    );
    return new SeedPostgres(client);
  },
  select: [
    // We don't alter any extensions tables that might be owned by extensions
    "!*",
    // We want to alter all the tables under public schema
    "public*",
    // We also want to alter some of the tables under the auth schema
    "auth.users",
    "auth.identities",
    "auth.sessions",
    // and storage
    "storage.buckets",
    "storage.objects",
    "storage.policies",
  ],
});
