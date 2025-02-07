"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableInfo {
  name: string
  columns: { name: string; type: string }[]
}

export default function QueryExecutor({ dbType }: { dbType: string }) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables")
      if (!response.ok) {
        throw new Error("Failed to fetch tables")
      }
      const data = await response.json()
      setTables(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tables")
    }
  }

  const handleTableClick = async (tableName: string) => {
    try {
      const response = await fetch(`/api/table?name=${encodeURIComponent(tableName)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch table information")
      }
      const data: TableInfo = await response.json()
      setSelectedTable(data)
      setQuery(`SELECT * FROM ${tableName} LIMIT 10;`)
      setResult(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch table information")
      setSelectedTable(null)
    }
  }

  const handleExecute = async () => {
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, dbType }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to execute query")
      }
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute query")
      setResult(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Executor</CardTitle>
        <CardDescription>Execute SQL queries against your database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-2">Tables</h3>
            <div className="space-y-2">
              {tables.map((table) => (
                <Button
                  key={table}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTableClick(table)}
                >
                  {table}
                </Button>
              ))}
            </div>
          </div>
          <div className="col-span-3">
            <div className="mb-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="min-h-[200px]"
              />
            </div>
            <Button onClick={handleExecute}>Execute Query</Button>
            {error && <div className="mt-4 text-red-500">Error: {error}</div>}
            {selectedTable && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">{selectedTable.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column Name</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTable.columns.map((column) => (
                      <TableRow key={column.name}>
                        <TableCell>{column.name}</TableCell>
                        <TableCell>{column.type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Query Result</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{result}</pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
