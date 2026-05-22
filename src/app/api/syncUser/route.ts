import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_1muEnKZb3evt@ep-proud-sky-alhnwmsu-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      users = await sql`
        INSERT INTO users (email, name, avatar_url)
        VALUES (${email}, '', '')
        RETURNING *;
      `;
    }

    const scans = await sql`
      SELECT * FROM scans 
      WHERE user_email = ${email} 
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      ...users[0],
      scans: scans || []
    });
  } catch (error) {
    console.error('Database GET Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, name, avatar_url, action, scans_used, plan, url, results } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (action === 'saveScan') {
      const resultsStr = JSON.stringify(results || []);
      // 1. Insert scan into scans table
      await sql`
        INSERT INTO scans (user_email, scanned_url, results_payload)
        VALUES (${email}, ${url || ''}, ${resultsStr});
      `;
      // 2. Increment user's scans_used
      const userUpdate = await sql`
        UPDATE users
        SET scans_used = scans_used + 1
        WHERE email = ${email}
        RETURNING *;
      `;
      // 3. Fetch all scans for the user to return
      const scans = await sql`
        SELECT * FROM scans 
        WHERE user_email = ${email} 
        ORDER BY created_at DESC;
      `;
      return NextResponse.json({
        ...userUpdate[0],
        scans: scans || []
      });
    }

    if (action === 'updateScans') {
      const result = await sql`
        UPDATE users 
        SET scans_used = ${scans_used}
        WHERE email = ${email}
        RETURNING *;
      `;
      const scans = await sql`
        SELECT * FROM scans 
        WHERE user_email = ${email} 
        ORDER BY created_at DESC;
      `;
      return NextResponse.json({
        ...(result[0] || {}),
        scans: scans || []
      });
    }

    if (action === 'upgradePlan') {
      const result = await sql`
        UPDATE users 
        SET plan = ${plan}
        WHERE email = ${email}
        RETURNING *;
      `;
      const scans = await sql`
        SELECT * FROM scans 
        WHERE user_email = ${email} 
        ORDER BY created_at DESC;
      `;
      return NextResponse.json({
        ...(result[0] || {}),
        scans: scans || []
      });
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

    const scans = await sql`
      SELECT * FROM scans 
      WHERE user_email = ${email} 
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      ...users[0],
      scans: scans || []
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
