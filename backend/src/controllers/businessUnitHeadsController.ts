import { Request, Response } from 'express';
import pool from '../database/db';

// Get all active Business Unit Heads
export const getBusinessUnitHeads = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM business_unit_heads
       WHERE is_active = true
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching business unit heads:', error);
    res.status(500).json({ message: 'Failed to fetch business unit heads' });
  }
};

// Get a single Business Unit Head by ID
export const getBusinessUnitHeadById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, is_active
       FROM business_unit_heads
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business Unit Head not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching business unit head:', error);
    res.status(500).json({ message: 'Failed to fetch business unit head' });
  }
};

// Create a new Business Unit Head
export const createBusinessUnitHead = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO business_unit_heads (name, email)
       VALUES ($1, $2)
       RETURNING id, name, email, is_active, created_at`,
      [name, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating business unit head:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create business unit head' });
    }
  }
};

// Update a Business Unit Head
export const updateBusinessUnitHead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, is_active } = req.body;

    const result = await pool.query(
      `UPDATE business_unit_heads
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           is_active = COALESCE($3, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, is_active, updated_at`,
      [name, email, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business Unit Head not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating business unit head:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Failed to update business unit head' });
    }
  }
};

// Delete (deactivate) a Business Unit Head
export const deleteBusinessUnitHead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const result = await pool.query(
      `UPDATE business_unit_heads
       SET is_active = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business Unit Head not found' });
    }

    res.json({ message: 'Business Unit Head deactivated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting business unit head:', error);
    res.status(500).json({ message: 'Failed to delete business unit head' });
  }
};
