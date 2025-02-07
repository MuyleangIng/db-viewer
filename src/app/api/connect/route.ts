// import { NextResponse } from 'next/server'
// import { connectToDatabase } from '@/lib/db'

// export async function POST(req: Request) {
//   const { connectionString, dbType } = await req.json()

//   const result = await connectToDatabase(connectionString, dbType)

//   if (result.success) {
//     return NextResponse.json({ message: result.message })
//   } else {
//     return NextResponse.json({ error: result.message }, { status: 500 })
//   }
// }

// app/api/connect/route.ts
import { NextResponse } from "next/server"
import { Pool } from 'pg'

export async function POST(request: Request) {
  try {
    const { connectionString, dbType } = await request.json()

    const pool = new Pool({
      connectionString: connectionString
    })

    // Test connection
    const client = await pool.connect()

    // Get table schema
    const schemaQuery = `
      SELECT 
        t.table_name,
        array_agg(
          json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'references', 
              CASE 
                WHEN tc.constraint_type = 'FOREIGN KEY' 
                THEN ccu.table_name || '.' || ccu.column_name
                ELSE null
              END
          )
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c 
        ON t.table_name = c.table_name
      LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name;
    `

    const result = await client.query(schemaQuery)
    client.release()

    // Transform the data to match the frontend schema structure
    const schema = {
      tables: result.rows.map(row => ({
        name: row.table_name,
        columns: row.columns
      }))
    }

    return NextResponse.json({
      success: true,
      schema: schema
    })

  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to connect to database"
    }, { status: 500 })
  }
}