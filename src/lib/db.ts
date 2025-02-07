import { Pool } from 'pg'
import mysql from 'mysql2/promise'
import { MongoClient } from 'mongodb'

type DatabaseType = 'postgresql' | 'mysql' | 'mongodb'

interface DatabaseConnection {
  connection: Pool | mysql.Connection | MongoClient | null
  dbType: DatabaseType | null
}

let dbConnection: DatabaseConnection = {
  connection: null,
  dbType: null
}

export async function connectToDatabase(connectionString: string, type: DatabaseType) {
  try {
    switch (type) {
      case 'postgresql':
        dbConnection.connection = new Pool({ connectionString })
        await dbConnection.connection.query('SELECT 1')
        break
      case 'mysql':
        dbConnection.connection = await mysql.createConnection(connectionString)
        await dbConnection.connection.query('SELECT 1')
        break
      case 'mongodb':
        dbConnection.connection = await MongoClient.connect(connectionString)
        await dbConnection.connection.db().command({ ping: 1 })
        break
      default:
        throw new Error('Unsupported database type')
    }
    dbConnection.dbType = type
    return { success: true, message: 'Connected successfully' }
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    return { success: false, message: 'Failed to connect to the database' }
  }
}

export function getConnection() {
  return dbConnection.connection
}

export function getDbType() {
  return dbConnection.dbType
}

export function closeConnection() {
  if (dbConnection.connection) {
    switch (dbConnection.dbType) {
      case 'postgresql':
        (dbConnection.connection as Pool).end()
        break
      case 'mysql':
        (dbConnection.connection as mysql.Connection).end()
        break
      case 'mongodb':
        (dbConnection.connection as MongoClient).close()
        break
    }
    dbConnection.connection = null
    dbConnection.dbType = null
  }
}
