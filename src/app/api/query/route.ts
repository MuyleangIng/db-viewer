import { NextResponse } from 'next/server'
import { getConnection, getDbType } from '@/lib/db'

export async function POST(req: Request) {
  const { query } = await req.json()
  const connection = getConnection()
  const dbType = getDbType()

  if (!connection) {
    return NextResponse.json({ error: 'Not connected to a database' }, { status: 400 })
  }

  try {
    let result
    switch (dbType) {
      case 'postgresql':
        result = await connection.query(query)
        break
      case 'mysql':
        const [rows] = await connection.query(query)
        result = rows
        break
      case 'mongodb':
        const db = connection.db()
        result = await db.eval(query)
        break
      default:
        throw new Error('Unsupported database type')
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to execute query:', error)
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 })
  }
}
