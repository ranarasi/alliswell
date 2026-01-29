import { Response } from 'express';
import pool from '../database/db';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let query = `
      SELECT p.*, u.name as pdm_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_pdm = u.id
    `;
    let params: any[] = [];

    // Delivery Directors can only see their assigned projects
    if (user && user.role === 'PDM') {
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
    const user = req.user;

    let query = `
      SELECT p.*, u.name as pdm_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_pdm = u.id
      WHERE p.id = $1
    `;
    let params: any[] = [id];

    // Delivery Directors can only see their assigned projects
    if (user && user.role === 'PDM') {
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
    const { name, client, description, startDate, status, assignedPDM, projectManager, businessUnitHead, aiUsage } = req.body;

    if (!name || !client || !startDate || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, client, description, start_date, status, assigned_pdm, project_manager, business_unit_head, ai_usage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, client, description || null, startDate, status, assignedPDM || null, projectManager || null, businessUnitHead || null, aiUsage || null]
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
    const { name, client, description, startDate, status, assignedPdm, assignedPDM, projectManager, businessUnitHead, aiUsage } = req.body;

    // Support both camelCase variations
    const pdmValue = assignedPdm !== undefined ? assignedPdm : assignedPDM;

    // Build dynamic update query to only update provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (client !== undefined) {
      updates.push(`client = $${paramCount}`);
      values.push(client);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (pdmValue !== undefined) {
      updates.push(`assigned_pdm = $${paramCount}`);
      values.push(pdmValue || null);
      paramCount++;
    }
    if (projectManager !== undefined) {
      updates.push(`project_manager = $${paramCount}`);
      values.push(projectManager || null);
      paramCount++;
    }
    if (businessUnitHead !== undefined) {
      updates.push(`business_unit_head = $${paramCount}`);
      values.push(businessUnitHead || null);
      paramCount++;
    }
    if (aiUsage !== undefined) {
      updates.push(`ai_usage = $${paramCount}`);
      values.push(aiUsage || null);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
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
