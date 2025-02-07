// 
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import DatabaseDiagram from "./DatabaseDiagram"
import QueryExecutor from "./QueryExecutor"
import TableList, { type Table } from "./TableList"

export default function DatabaseManager() {
  const [connectionString, setConnectionString] = useState("")
  const [dbType, setDbType] = useState("postgresql")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schema, setSchema] = useState<{ tables: Table[] } | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString, dbType }),
      })
      if (!response.ok) throw new Error("Failed to connect")
      const data = await response.json()
      setSchema(data.schema || { tables: [] })
      setIsConnected(true)
    } catch (err) {
      setError("Failed to connect to the database")
      setIsConnected(false)
      setSchema(null)
    } finally {
      setIsConnecting(false)
    }
  }

  const getPlaceholder = () => {
    switch (dbType) {
      case "postgresql":
        return "postgresql://username:password@localhost:5432/database"
      case "mysql":
        return "mysql://username:password@localhost:3306/database"
      case "mongodb":
        return "mongodb://username:password@localhost:27017/database"
      default:
        return "Enter connection string"
    }
  }

  const handleCommentChange = (tableName: string, comment: string) => {
    setSchema((prevSchema) => {
      if (!prevSchema) return null
      return {
        tables: prevSchema.tables.map((table) => (table.name === tableName ? { ...table, comment } : table)),
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription>Connect to your database and manage its schema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Select value={dbType} onValueChange={setDbType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select DB Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-grow relative">
              <Input
                type="text"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder={getPlaceholder()}
                className="pr-10"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Example connection string format</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Connecting...
                </>
              ) : (
                <>
                  {isConnected && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                  Connect
                </>
              )}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isConnected && (
            <Tabs defaultValue="diagram" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diagram">Database Diagram</TabsTrigger>
                <TabsTrigger value="tables">Table List</TabsTrigger>
                <TabsTrigger value="query">Query Executor</TabsTrigger>
              </TabsList>
              <TabsContent value="diagram">
                <DatabaseDiagram dbType={dbType} schema={schema} />
              </TabsContent>
              <TabsContent value="tables">
                <TableList schema={schema} onCommentChange={handleCommentChange} />
              </TabsContent>
              <TabsContent value="query">
                <QueryExecutor dbType={dbType} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
