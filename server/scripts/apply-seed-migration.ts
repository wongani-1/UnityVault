import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log("🔄 Applying seed/share migration to Supabase...");

  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "20260222103000_member_seed_shares.sql");
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // If the RPC doesn't exist, try direct query
      console.log("ℹ️  Trying direct SQL execution...");
      const result = await supabase.from("_sql_").select("*").limit(0);
      
      // Since Supabase client doesn't support arbitrary SQL, we'll log instructions
      console.log("\n⚠️  Cannot execute SQL directly via Supabase client.");
      console.log("\n📋 Please apply the migration manually:");
      console.log("\n1. Go to your Supabase Dashboard");
      console.log("2. Navigate to SQL Editor");
      console.log("3. Run this SQL:\n");
      console.log("─".repeat(60));
      console.log(sql);
      console.log("─".repeat(60));
      return;
    }

    console.log("✅ Migration applied successfully!");
  } catch (err) {
    console.error("❌ Error applying migration:", err);
    console.log("\n📋 Please apply the migration manually:");
    console.log("\n1. Go to your Supabase Dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Run this SQL:\n");
    console.log("─".repeat(60));
    console.log(sql);
    console.log("─".repeat(60));
  }
}

applyMigration();
