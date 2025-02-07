// app/api/schema/examples/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const examples = {
    "Schema Information": [
      {
        name: "List All Tables with Row Counts",
        query: `
SELECT 
    schemaname as schema,
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY schema, table_name;`,
        description: "Shows all tables in your database with their current row counts"
      },
      {
        name: "Table Sizes",
        query: `
SELECT
    table_schema as schema,
    table_name,
    pg_size_pretty(pg_total_relation_size('"' || table_schema || '"."' || table_name || '"')) as total_size
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size('"' || table_schema || '"."' || table_name || '"') DESC;`,
        description: "Display table sizes including indexes and related objects"
      }
    ],
    "Column Information": [
      {
        name: "List All Foreign Keys",
        query: `
SELECT
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';`,
        description: "Shows all foreign key relationships in the database"
      },
      {
        name: "Column Types Summary",
        query: `
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;`,
        description: "Lists all columns with their data types and properties"
      }
    ],
    "Table Specific": [
      {
        name: "Code Configurations Overview",
        query: `
SELECT 
    conf_id,
    name,
    version,
    selected_backend,
    created_at,
    updated_at
FROM code_configurations
ORDER BY updated_at DESC
LIMIT 10;`,
        description: "Shows recent code configurations"
      },
      {
        name: "Results Summary",
        query: `
SELECT 
    execution_status,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM results
GROUP BY execution_status;`,
        description: "Summary of execution results by status"
      }
    ],
    "Database Stats": [
      {
        name: "Database Size",
        query: `
SELECT 
    pg_database.datname as database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;`,
        description: "Shows sizes of all databases"
      },
      {
        name: "Index Usage Stats",
        query: `
SELECT 
    schemaname || '.' || relname as table,
    indexrelname as index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE idx_scan = 0 
ORDER BY pg_relation_size(i.indexrelid) DESC;`,
        description: "Find unused indexes that might be candidates for removal"
      }
    ]
  };

  return NextResponse.json(examples);
}