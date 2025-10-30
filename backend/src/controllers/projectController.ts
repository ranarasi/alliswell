import { Response } from 'express';
import pool from '../database/db';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let query = `
      SELECT p.*, u.name as pdm_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_pdm = u.id
    `;
    let params: any[] = [];

    // Delivery Directors can only see their assigned projects
    if (user.role === 'PDM') {
      query += ' WHERE p.assigned_pdm = $1';
      params.push(user.id);
    }

    // Filter by status
    if (req.query.status) {
      query += params.length > 0 ? ' AND' : ' WHERE';
      query += ` p.status = $${params.length + 1}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY p.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    let query = `
      SELECT p.*, u.name as pdm_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_pdm = u.id
      WHERE p.id = $1
    `;
    let params: any[] = [id];

    // Delivery Directors can only see their assigned projects
    if (user.role === 'PDM') {
      query += ' AND p.assigned_pdm = $2';
      params.push(user.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, client, startDate, status, assignedPDM } = req.body;

    if (!name || !client || !startDate || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, client, start_date, status, assigned_pdm)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, client, startDate, status, assignedPDM || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Project name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, client, startDate, status, assignedPDM } = req.body;

    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           client = COALESCE($2, client),
           start_date = COALESCE($3, start_date),
           status = COALESCE($4, status),
           assigned_pdm = COALESCE($5, assigned_pdm),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, client, startDate, status, assignedPDM, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update project error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Project name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
