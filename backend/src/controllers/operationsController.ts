import { Response } from 'express';
import pool from '../database/db';
import { AuthRequest } from '../middleware/auth';

// Get all operations for a project
export const getProjectOperations = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = req.user!;

    // Check if user has access to this project
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // PDMs can only see their own projects
    if (user.role === 'PDM' && projectCheck.rows[0].assigned_pdm !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT po.*, u.name as submitted_by_name
       FROM project_operations po
       LEFT JOIN users u ON po.submitted_by = u.id
       WHERE po.project_id = $1
       ORDER BY po.year DESC, po.month DESC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get project operations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get specific month's operations data
export const getOperationsByMonth = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, month, year } = req.params;
    const user = req.user!;

    // Check if user has access to this project
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // PDMs can only see their own projects
    if (user.role === 'PDM' && projectCheck.rows[0].assigned_pdm !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT po.*, u.name as submitted_by_name
       FROM project_operations po
       LEFT JOIN users u ON po.submitted_by = u.id
       WHERE po.project_id = $1 AND po.month = $2 AND po.year = $3`,
      [projectId, month, year]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Operations data not found for this month' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get operations by month error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create or update operations data
export const upsertOperations = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const {
      month,
      year,
      teamSize,
      revenue,
      cost,
      gmPercentage,
      utilizationPercentage,
      shadows,
      rampUp,
      rampDown,
      openPositions,
    } = req.body;
    const user = req.user!;

    // Validate required fields
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Check if user has access to this project
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // PDMs can only update their own projects
    if (user.role === 'PDM' && projectCheck.rows[0].assigned_pdm !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Upsert the operations data
    const result = await pool.query(
      `INSERT INTO project_operations (
        project_id, month, year, team_size, revenue, cost,
        gm_percentage, utilization_percentage, shadows,
        ramp_up, ramp_down, open_positions, submitted_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (project_id, month, year)
      DO UPDATE SET
        team_size = EXCLUDED.team_size,
        revenue = EXCLUDED.revenue,
        cost = EXCLUDED.cost,
        gm_percentage = EXCLUDED.gm_percentage,
        utilization_percentage = EXCLUDED.utilization_percentage,
        shadows = EXCLUDED.shadows,
        ramp_up = EXCLUDED.ramp_up,
        ramp_down = EXCLUDED.ramp_down,
        open_positions = EXCLUDED.open_positions,
        submitted_by = EXCLUDED.submitted_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        projectId,
        month,
        year,
        teamSize || 0,
        revenue || 0,
        cost || 0,
        gmPercentage || 0,
        utilizationPercentage || 0,
        shadows || 0,
        rampUp || 0,
        rampDown || 0,
        openPositions || 0,
        user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upsert operations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete operations data
export const deleteOperations = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, id } = req.params;
    const user = req.user!;

    // Check if user has access to this project
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // PDMs can only delete their own project data
    // Admins can delete any
    if (user.role === 'PDM' && projectCheck.rows[0].assigned_pdm !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      'DELETE FROM project_operations WHERE id = $1 AND project_id = $2 RETURNING *',
      [id, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Operations data not found' });
    }

    res.json({ message: 'Operations data deleted successfully' });
  } catch (error) {
    console.error('Delete operations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
