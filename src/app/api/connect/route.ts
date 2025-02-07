import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'

export async function POST(req: Request) {
  const { connectionString, dbType } = await req.json()

  const result = await connectToDatabase(connectionString, dbType)

  if (result.success) {
    return NextResponse.json({ message: result.message })
  } else {
    return NextResponse.json({ error: result.message }, { status: 500 })
  }
}
