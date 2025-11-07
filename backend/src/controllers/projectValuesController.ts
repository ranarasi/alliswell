import { Request, Response } from 'express';
import pool from '../database/db';

// Get all values for a project
export const getProjectValues = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT pv.*, u.name as submitted_by_name
       FROM project_values pv
       LEFT JOIN users u ON pv.submitted_by = u.id
       WHERE pv.project_id = $1
       ORDER BY pv.created_at DESC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project values:', error);
    res.status(500).json({ message: 'Failed to fetch project values' });
  }
};

// Create a new value entry
export const createProjectValue = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;
    const userName = (req as any).user.name;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const result = await pool.query(
      `INSERT INTO project_values (project_id, content, submitted_by, submitted_by_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [projectId, content, userId, userName]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project value:', error);
    res.status(500).json({ message: 'Failed to create project value' });
  }
};

// Delete a value entry
export const deleteProjectValue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM project_values WHERE id = $1', [id]);

    res.json({ message: 'Value deleted successfully' });
  } catch (error) {
    console.error('Error deleting project value:', error);
    res.status(500).json({ message: 'Failed to delete project value' });
  }
};
