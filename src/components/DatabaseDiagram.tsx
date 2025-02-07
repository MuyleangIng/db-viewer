"use client"

import { useEffect, useState, useCallback } from "react"
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  ReactFlowProvider,
  Panel,
} from "reactflow"
import { ReloadIcon, DownloadIcon } from "@radix-ui/react-icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import "reactflow/dist/style.css"

interface DatabaseDiagramProps {
  dbType: string
}

// Custom node for database tables
const TableNode = ({ data }) => {
  return (
    <div
      className={`bg-white border-2 ${data.isHighlighted ? "border-yellow-400" : "border-primary"} rounded-lg shadow-lg p-4 min-w-[200px]`}
    >
      <div
        className={`font-bold text-lg border-b-2 ${data.isHighlighted ? "border-yellow-400" : "border-primary"} pb-2 mb-2`}
      >
        {data.label}
      </div>
      <div className="space-y-1">
        {data.columns?.map((column, index) => (
          <div key={index} className="text-sm flex items-center justify-between">
            <span className="font-medium">{column.name}</span>
            <span className="text-muted-foreground">{column.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

export default function DatabaseDiagram({ dbType }: DatabaseDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const calculateNodePositions = useCallback((tables) => {
    const VERTICAL_SPACING = 200
    const HORIZONTAL_SPACING = 300
    const MAX_COLUMNS = 3

    return tables.map((table, index) => ({
      id: table.name,
      type: "tableNode",
      data: {
        label: table.name,
        columns: table.columns,
        isHighlighted: false,
      },
      position: {
        x: (index % MAX_COLUMNS) * HORIZONTAL_SPACING + 50,
        y: Math.floor(index / MAX_COLUMNS) * VERTICAL_SPACING + 50,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }))
  }, [])

  const calculateEdges = useCallback((tables) => {
    const edges = []
    tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.references) {
          edges.push({
            id: `${table.name}-${column.references}`,
            source: table.name,
            target: column.references,
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            animated: true,
            style: {
              strokeWidth: 2,
            },
            label: column.name,
          })
        }
      })
    })
    return edges
  }, [])

  const fetchSchema = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/schema")
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText}`)
      }
      const schema = await response.json()

      if (!schema.tables || !Array.isArray(schema.tables)) {
        throw new Error("Invalid schema format received")
      }

      const newNodes = calculateNodePositions(schema.tables)
      const newEdges = calculateEdges(schema.tables)

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (error) {
      console.error("Failed to fetch schema:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch database schema")
    } finally {
      setIsLoading(false)
    }
  }, [calculateNodePositions, calculateEdges, setNodes, setEdges])

  useEffect(() => {
    fetchSchema()
  }, [fetchSchema])

  const handleRetry = () => {
    fetchSchema()
  }

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term)
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted:
              node.data.label.toLowerCase().includes(term.toLowerCase()) ||
              node.data.columns.some((column) => column.name.toLowerCase().includes(term.toLowerCase())),
          },
        })),
      )
    },
    [setNodes],
  )

  const onExportImage = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance
        .toImage({
          quality: 0.95,
          width: 1920,
          height: 1080,
          backgroundColor: "#ffffff",
        })
        .then((dataUrl) => {
          const link = document.createElement("a")
          link.href = dataUrl
          link.download = "database-diagram.png"
          link.click()
        })
    }
  }, [reactFlowInstance])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Schema Diagram</CardTitle>
          <CardDescription>Visual representation of your database schema</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} variant="outline">
            <ReloadIcon className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Schema Diagram</CardTitle>
        <CardDescription>Visual representation of your database schema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Input
            type="text"
            placeholder="Search tables or columns"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={onExportImage} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Image
          </Button>
        </div>
        <div className="h-[600px] border rounded-lg bg-secondary/10 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
              <div className="flex items-center space-x-2">
                <ReloadIcon className="h-5 w-5 animate-spin" />
                <span>Loading schema...</span>
              </div>
            </div>
          )}
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background"
              onInit={setReactFlowInstance}
            >
              <Background gap={12} size={1} />
              <Controls />
              <Panel position="top-right">
                <Button onClick={onExportImage} variant="outline" size="sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export Image
                </Button>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </CardContent>
    </Card>
  )
}

