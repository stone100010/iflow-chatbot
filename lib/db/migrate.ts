import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { readdirSync, renameSync, existsSync } from "fs";
import { join } from "path";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  const newMigrationsFolder = "./lib/db/migrations-new";
  const oldMigrationsFolder = "./lib/db/migrations";
  const oldMetaFolder = "./lib/db/migrations/meta";

  // Check if there are new migrations to run
  if (!existsSync(newMigrationsFolder)) {
    console.log("✅ No new migrations folder found. All migrations are up to date.");
    process.exit(0);
  }

  const newFiles = readdirSync(newMigrationsFolder).filter(f => f.endsWith('.sql'));

  if (newFiles.length === 0) {
    console.log("✅ No new migrations to run.");
    process.exit(0);
  }

  console.log("⏳ Running new migrations...");
  console.log(`📂 Found ${newFiles.length} new migration(s): ${newFiles.join(', ')}\n`);

  const start = Date.now();
  await migrate(db, { migrationsFolder: newMigrationsFolder });
  const end = Date.now();

  console.log(`✅ Migrations completed in ${end - start}ms\n`);

  // Move executed migrations back to old folder
  console.log("📦 Moving executed migrations to main folder...");

  const allNewFiles = readdirSync(newMigrationsFolder);

  for (const file of allNewFiles) {
    const sourcePath = join(newMigrationsFolder, file);

    if (file.endsWith('.sql')) {
      // Move SQL files to migrations folder
      const destPath = join(oldMigrationsFolder, file);
      renameSync(sourcePath, destPath);
      console.log(`   ✓ Moved ${file} → migrations/`);
    } else if (file.endsWith('.json')) {
      // Move JSON files to migrations/meta folder
      const destPath = join(oldMetaFolder, file);
      renameSync(sourcePath, destPath);
      console.log(`   ✓ Moved ${file} → migrations/meta/`);
    }
  }

  console.log("\n🎉 Migration complete! All files moved to main migrations folder.");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
