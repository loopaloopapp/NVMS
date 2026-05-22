import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_1muEnKZb3evt@ep-proud-sky-alhnwmsu-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

async function setup() {
  console.log("Creating users table...");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      avatar_url TEXT,
      plan VARCHAR(50) DEFAULT 'free',
      scans_used INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  console.log("Creating scans table...");
  await sql`
    CREATE TABLE IF NOT EXISTS scans (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
      scanned_url VARCHAR(255) NOT NULL,
      results_payload JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log("Creating pro account for the admin...");
  await sql`
    INSERT INTO users (email, name, plan, scans_used)
    VALUES ('admin@hydraseo.com', 'Admin (Pro)', 'pro', 0)
    ON CONFLICT (email) DO UPDATE SET plan = 'pro';
  `;

  await sql`
    INSERT INTO users (email, name, plan, scans_used)
    VALUES ('jericho1965@gmail.com', 'Jericho (Admin)', 'pro', 0)
    ON CONFLICT (email) DO UPDATE SET plan = 'pro';
  `;

  console.log("Database setup complete.");
}

setup().catch(console.error);
