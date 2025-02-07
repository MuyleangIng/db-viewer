"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface TableListProps {
  schema: { tables: Table[] } | null
  onCommentChange: (tableName: string, comment: string) => void
}

export default function TableList({ schema, onCommentChange }: TableListProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [comment, setComment] = useState("")

  const handleTableClick = (table: Table) => {
    setSelectedTable(table)
    setComment(table.comment || "")
  }

  const handleCommentSubmit = () => {
    if (selectedTable) {
      onCommentChange(selectedTable.name, comment)
      setSelectedTable({ ...selectedTable, comment })
    }
  }

  if (!schema || schema.tables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
          <CardDescription>No tables found in the schema</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
          <CardDescription>Click on a table to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schema.tables.map((table) => (
                <TableRow
                  key={table.name}
                  className={`cursor-pointer ${selectedTable?.name === table.name ? "bg-secondary" : ""}`}
                  onClick={() => handleTableClick(table)}
                >
                  <TableCell>{table.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </UITable>
        </CardContent>
      </Card>
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTable.name}</CardTitle>
            <CardDescription>Table details and comment</CardDescription>
          </CardHeader>
          <CardContent>
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>References</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTable.columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>{column.type}</TableCell>
                    <TableCell>{column.references || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
            <div className="mt-4">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment for this table..."
                className="mb-2"
              />
              <Button onClick={handleCommentSubmit}>Save Comment</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
