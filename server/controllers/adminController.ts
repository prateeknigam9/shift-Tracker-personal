import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '../auth';

// Get all tables in the database
export const getTables = async (_req: Request, res: Response) => {
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.status(200).json(tables.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Failed to fetch database tables' });
  }
};

// Get all data from a specific table
export const getTableData = async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    
    // Validate table name to prevent SQL injection
    const validTablePattern = /^[a-zA-Z0-9_]+$/;
    if (!validTablePattern.test(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const data = await db.execute(sql.raw(`SELECT * FROM "${tableName}" LIMIT 100`));
    
    // Also get the column information for the table
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position
    `);
    
    res.status(200).json({
      columns: columns.rows,
      data: data.rows
    });
  } catch (error) {
    console.error(`Error fetching data from ${req.params.tableName}:`, error);
    res.status(500).json({ message: `Failed to fetch data from table: ${error.message}` });
  }
};

// Update a record in a table
export const updateRecord = async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { id, data } = req.body;
    
    // Validate table name to prevent SQL injection
    const validTablePattern = /^[a-zA-Z0-9_]+$/;
    if (!validTablePattern.test(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }

    // Handle password hashing for users table
    if (tableName === 'users' && data.password && !data.password.includes('.')) {
      data.password = await hashPassword(data.password);
    }
    
    // Build the SET part of the query
    const setValues = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        // Validate column name to prevent SQL injection
        if (!validTablePattern.test(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
        return `"${key}" = ${value === null ? 'NULL' : `'${value}'`}`;
      })
      .join(', ');
    
    if (!setValues) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    const query = sql.raw(`
      UPDATE "${tableName}"
      SET ${setValues}
      WHERE id = ${id}
      RETURNING *
    `);
    
    const result = await db.execute(query);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error updating record in ${req.params.tableName}:`, error);
    res.status(500).json({ message: `Failed to update record: ${error.message}` });
  }
};

// Delete a record from a table
export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { id } = req.params;
    
    // Validate table name to prevent SQL injection
    const validTablePattern = /^[a-zA-Z0-9_]+$/;
    if (!validTablePattern.test(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const query = sql.raw(`
      DELETE FROM "${tableName}"
      WHERE id = ${id}
      RETURNING id
    `);
    
    const result = await db.execute(query);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.status(200).json({ message: 'Record deleted successfully', id });
  } catch (error) {
    console.error(`Error deleting record from ${req.params.tableName}:`, error);
    res.status(500).json({ message: `Failed to delete record: ${error.message}` });
  }
};

// Execute custom SQL query (with restrictions for safety)
export const executeQuery = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    // Prevent destructive operations unless explicitly confirmed
    if (
      (query.toLowerCase().includes('drop table') || 
       query.toLowerCase().includes('truncate table') ||
       query.toLowerCase().includes('delete from') ||
       query.toLowerCase().includes('drop database')) &&
      !req.body.confirmed
    ) {
      return res.status(400).json({ 
        message: 'This query may destroy data. Set "confirmed: true" in the request body if you\'re sure.',
        requiresConfirmation: true
      });
    }
    
    const result = await db.execute(sql.raw(query));
    
    res.status(200).json({
      rowCount: result.rowCount,
      rows: result.rows
    });
  } catch (error) {
    console.error('Error executing custom query:', error);
    res.status(500).json({ message: `Query error: ${error.message}` });
  }
};

// Run database migrations
export const runMigration = async (req: Request, res: Response) => {
  try {
    const { script } = req.body;
    
    if (!script) {
      return res.status(400).json({ message: 'No migration script provided' });
    }
    
    // Execute the migration script
    await db.execute(sql.raw(script));
    
    res.status(200).json({ message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({ message: `Migration failed: ${error.message}` });
  }
};