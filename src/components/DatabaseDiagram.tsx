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

interface Column {
  name: string
  type: string
  is_nullable: boolean
  is_primary: boolean
  references?: {
    table: string
    column: string
  }
}

interface Table {
  name: string
  columns: Column[]
}

interface Schema {
  tables: Table[]
}

interface DatabaseDiagramProps {
  schema: Schema | null
  dbType: string
}

// Custom node for database tables
const TableNode = ({ data }) => {
  return (
    <div className={`bg-white border-2 ${data.isHighlighted ? "border-yellow-400" : "border-primary"} rounded-lg shadow-lg p-4 min-w-[250px]`}>
      <div className={`font-bold text-lg border-b-2 ${data.isHighlighted ? "border-yellow-400" : "border-primary"} pb-2 mb-2`}>
        {data.label}
      </div>
      <div className="space-y-1">
        {data.columns?.map((column: Column, index: number) => (
          <div 
            key={index} 
            className={`text-sm flex items-center justify-between ${
              column.is_primary ? 'text-primary font-bold' : 
              column.references ? 'text-blue-600' : ''
            }`}
          >
            <span className="font-medium flex items-center gap-1">
              {column.is_primary && "🔑"}
              {column.references && "→"}
              {column.name}
            </span>
            <span className={`text-muted-foreground ${column.is_nullable ? 'italic' : ''}`}>
              {column.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

export default function DatabaseDiagram({ schema, dbType }: DatabaseDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const calculateNodePositions = useCallback((tables: Table[]) => {
    const VERTICAL_SPACING = 250
    const HORIZONTAL_SPACING = 350
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

  const calculateEdges = useCallback((tables: Table[]) => {
    const edges = []
    tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.references) {
          edges.push({
            id: `${table.name}-${column.name}-${column.references.table}`,
            source: table.name,
            target: column.references.table,
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            animated: true,
            style: {
              strokeWidth: 1.5,
              stroke: '#666',
            },
            label: `${column.name} → ${column.references.column}`,
            labelStyle: { fill: '#666', fontSize: 12 },
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: '#fff', opacity: 0.8 },
          })
        }
      })
    })
    return edges
  }, [])

  useEffect(() => {
    if (schema?.tables) {
      const newNodes = calculateNodePositions(schema.tables)
      const newEdges = calculateEdges(schema.tables)
      setNodes(newNodes)
      setEdges(newEdges)
      setIsLoading(false)
    }
  }, [schema, calculateNodePositions, calculateEdges, setNodes, setEdges])

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
              node.data.columns.some((column: Column) => 
                column.name.toLowerCase().includes(term.toLowerCase()) ||
                column.type.toLowerCase().includes(term.toLowerCase())
              ),
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

  if (!schema?.tables) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Schema Diagram</CardTitle>
          <CardDescription>No schema available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No database schema is currently available. Please connect to a database first.
            </AlertDescription>
          </Alert>
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