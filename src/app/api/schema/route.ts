import { NextResponse } from 'next/server'
import { getConnection, getDbType } from '@/lib/db'

export async function GET(req: Request) {
  const connection = getConnection()
  const dbType = getDbType()

  if (!connection) {
    return NextResponse.json({ error: 'Not connected to a database' }, { status: 400 })
  }

  try {
    let schema
    switch (dbType) {
      case 'postgresql':
        schema = await getPostgresSchema(connection)
        break
      case 'mysql':
        schema = await getMySQLSchema(connection)
        break
      case 'mongodb':
        schema = await getMongoDBSchema(connection)
        break
      default:
        throw new Error('Unsupported database type')
    }
    return NextResponse.json(schema)
  } catch (error) {
    console.error('Failed to fetch schema:', error)
    return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 })
  }
}

async function getPostgresSchema(connection) {
  const result = await connection.query(`
    SELECT 
      table_name, 
      column_name, 
      data_type
    FROM 
      information_schema.columns
    WHERE 
      table_schema = 'public'
    ORDER BY 
      table_name, 
      ordinal_position
  `)
  
  const schema = { tables: [] }
  let currentTable = null
  
  for (const row of result.rows) {
    if (currentTable?.name !== row.table_name) {
      if (currentTable) schema.tables.push(currentTable)
      currentTable = { name: row.table_name, columns: [] }
    }
    currentTable.columns.push({ name: row.column_name, type: row.data_type })
  }
  
  if (currentTable) schema.tables.push(currentTable)
  
  return schema
}

async function getMySQLSchema(connection) {
  const [rows] = await connection.query(`
    SELECT 
      TABLE_NAME, 
      COLUMN_NAME, 
      DATA_TYPE
    FROM 
      INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = DATABASE()
    ORDER BY 
      TABLE_NAME, 
      ORDINAL_POSITION
  `)
  
  const schema = { tables: [] }
  let currentTable = null
  
  for (const row of rows) {
    if (currentTable?.name !== row.TABLE_NAME) {
      if (currentTable) schema.tables.push(currentTable)
      currentTable = { name: row.TABLE_NAME, columns: [] }
    }
    currentTable.columns.push({ name: row.COLUMN_NAME, type: row.DATA_TYPE })
  }
  
  if (currentTable) schema.tables.push(currentTable)
  
  return schema
}

async function getMongoDBSchema(connection) {
  const db = connection.db()
  const collections = await db.listCollections().toArray()
  
  const schema = { tables: [] }
  
  for (const collection of collections) {
    const sample = await db.collection(collection.name).findOne()
    const columns = Object.keys(sample).map(key => ({ name: key, type: typeof sample[key] }))
    schema.tables.push({ name: collection.name, columns })
  }
  
  return schema
}
