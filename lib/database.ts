import mysql from "mysql2/promise"

let connection: mysql.Connection | null = null

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "invoice_db",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      timezone: "+00:00",
      dateStrings: true,
    })
  }
  return connection
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const conn = await getConnection()
    const [rows] = await conn.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function executeInsert(
  query: string,
  params: any[] = [],
): Promise<{ insertId: number; affectedRows: number }> {
  try {
    const conn = await getConnection()
    const [result] = await conn.execute(query, params)
    const insertResult = result as mysql.ResultSetHeader
    return {
      insertId: insertResult.insertId,
      affectedRows: insertResult.affectedRows,
    }
  } catch (error) {
    console.error("Database insert error:", error)
    throw error
  }
}

export async function executeUpdate(
  query: string,
  params: any[] = [],
): Promise<{ affectedRows: number; changedRows: number }> {
  try {
    const conn = await getConnection()
    const [result] = await conn.execute(query, params)
    const updateResult = result as mysql.ResultSetHeader
    return {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows,
    }
  } catch (error) {
    console.error("Database update error:", error)
    throw error
  }
}

// Close connection when needed
export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end()
    connection = null
  }
}
