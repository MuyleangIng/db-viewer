"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

export interface Column {
  name: string
  type: string
  references?: string
}

export interface Table {
  name: string
  columns: Column[]
  comment?: string
}

export default function TableRequest() {
  const [tableName, setTableName] = useState("")
  const [table, setTable] = useState<Table | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTableRequest = async () => {
    setIsLoading(true)
    setError(null)
    setTable(null)

    try {
      const response = await fetch(`/api/table?name=${encodeURIComponent(tableName)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch table information")
      }
      const data = await response.json()
      setTable(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching table information")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Request</CardTitle>
        <CardDescription>Enter a table name to fetch its information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Enter table name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleTableRequest} disabled={isLoading}>
            {isLoading ? "Loading..." : "Fetch Table"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {table && (
          <div>
            <h3 className="text-lg font-semibold mb-2">{table.name}</h3>
            {table.comment && <p className="text-sm text-gray-500 mb-4">{table.comment}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>References</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>{column.type}</TableCell>
                    <TableCell>{column.references || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
