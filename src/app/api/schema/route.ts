// app/api/schema/route.ts
import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a pool connection with your specific credentials
const pool = new Pool({
  user: 'postgres',
  password: '12345', // replace with your actual password
  host: '202.178.125.77',
  port: 5443,
  database: 'dev-qamel'
})

// Add connection error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export async function GET() {
  let client;
  try {
    // Test connection
    client = await pool.connect()
    console.log("Database connected successfully")

// app/api/schema/route.ts
// Update the query to better expose foreign key relationships
const schemaQuery = `
  WITH fk_info AS (
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc 
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
  )
  SELECT 
    t.table_name,
    json_agg(
      json_build_object(
        'name', c.column_name,
        'type', c.data_type,
        'is_primary', EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = t.table_name 
            AND kcu.column_name = c.column_name
            AND tc.constraint_type = 'PRIMARY KEY'
        ),
        'foreign_key', (
          SELECT json_build_object(
            'table', fk.foreign_table,
            'column', fk.foreign_column
          )
          FROM fk_info fk
          WHERE fk.table_name = t.table_name 
            AND fk.column_name = c.column_name
        )
      )
      ORDER BY c.ordinal_position
    ) as columns
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name;
`;

// ... rest of the API code ...
    const result = await client.query(schemaQuery)
    console.log("Query executed successfully:", result.rows)

    return NextResponse.json({
      success: true,
      schema: result.rows.map(row => ({
        name: row.table_name,
        columns: row.columns
      }))
    })

  } catch (error) {
    console.error("Error fetching schema:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to fetch schema" 
    }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
}