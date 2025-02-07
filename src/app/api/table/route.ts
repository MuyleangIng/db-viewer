// app/api/tables/route.ts
import { NextResponse } from "next/server"
import { Pool } from 'pg'

const pool = new Pool({
  // your database configuration
})

interface TableInfo {
  name: string
  columns: { name: string; type: string }[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("name")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const client = await pool.connect()
    const query = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = $1
    `
    const result = await client.query(query, [tableName])
    client.release()

    const tableInfo: TableInfo = {
      name: tableName,
      columns: result.rows.map(row => ({
        name: row.column_name,
        type: row.character_maximum_length 
          ? `${row.data_type}(${row.character_maximum_length})`
          : row.data_type
      }))
    }

    return NextResponse.json(tableInfo)
  } catch (error) {
    console.error("Error fetching table information:", error)
    return NextResponse.json({ error: "Failed to fetch table information" }, { status: 500 })
  }
}