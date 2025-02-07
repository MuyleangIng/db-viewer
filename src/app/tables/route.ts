// app/api/tables/route.ts
import { NextResponse } from "next/server"
import { Pool } from 'pg'

const pool = new Pool({
  // your database configuration
})

export async function GET() {
  try {
    const client = await pool.connect()
    const query = `
      SELECT DISTINCT c.relname AS table_name
      FROM pg_database d
      JOIN pg_namespace n ON true
      JOIN pg_class c ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'  -- Only include regular tables
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_name;
    `
    const result = await client.query(query)
    client.release()

    // Return just the array of table names
    return NextResponse.json(result.rows.map(row => row.table_name))

  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}