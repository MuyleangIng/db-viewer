import { NextResponse } from "next/server"

interface TableInfo {
  name: string
  columns: { name: string; type: string }[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")

  if (!name) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    // Here you would typically query your database for the table information
    // For this example, we'll return mock data
    const tableInfo: TableInfo = {
      name: name,
      columns: [
        { name: "id", type: "integer" },
        { name: "name", type: "varchar(255)" },
        { name: "created_at", type: "timestamp" },
      ],
    }

    return NextResponse.json(tableInfo)
  } catch (error) {
    console.error("Error fetching table information:", error)
    return NextResponse.json({ error: "Failed to fetch table information" }, { status: 500 })
  }
}

