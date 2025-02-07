import { NextResponse } from "next/server"

interface TableData {
  columns: string[]
  rows: any[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")

  if (!name) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    // Here you would typically query your database for the table data
    // For this example, we'll return mock data
    const tableData: TableData = {
      columns: ["id", "name", "created_at"],
      rows: [
        { id: 1, name: "John Doe", created_at: "2023-01-01" },
        { id: 2, name: "Jane Smith", created_at: "2023-01-02" },
        { id: 3, name: "Bob Johnson", created_at: "2023-01-03" },
      ],
    }

    return NextResponse.json(tableData)
  } catch (error) {
    console.error("Error fetching table data:", error)
    return NextResponse.json({ error: "Failed to fetch table data" }, { status: 500 })
  }
}

