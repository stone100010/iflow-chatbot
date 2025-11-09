import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL!;

async function main() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Adding isNameCustomized column to Workspace table...");

  try {
    await client`
      ALTER TABLE "Workspace"
      ADD COLUMN IF NOT EXISTS "isNameCustomized" boolean DEFAULT false NOT NULL
    `;
    console.log("✅ Column added successfully!");
  } catch (error) {
    console.error("❌ Error adding column:", error);
  } finally {
    await client.end();
  }
}

main();
