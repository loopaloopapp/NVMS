import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_1muEnKZb3evt@ep-proud-sky-alhnwmsu-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

export async function POST(request: Request) {
  try {
    const { email, name, avatar_url, action, scans_used, plan } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (action === 'updateScans') {
      const result = await sql`
        UPDATE users 
        SET scans_used = ${scans_used}
        WHERE email = ${email}
        RETURNING *;
      `;
      return NextResponse.json(result[0] || {});
    }

    if (action === 'upgradePlan') {
      const result = await sql`
        UPDATE users 
        SET plan = ${plan}
        WHERE email = ${email}
        RETURNING *;
      `;
      return NextResponse.json(result[0] || {});
    }

    // Default action: Sync User on Login
    let users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      users = await sql`
        INSERT INTO users (email, name, avatar_url)
        VALUES (${email}, ${name || ''}, ${avatar_url || ''})
        RETURNING *;
      `;
    } else if (name || avatar_url) {
       // Optional: update name and avatar if they changed
       users = await sql`
        UPDATE users
        SET name = COALESCE(${name}, name),
            avatar_url = COALESCE(${avatar_url}, avatar_url)
        WHERE email = ${email}
        RETURNING *;
       `;
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
