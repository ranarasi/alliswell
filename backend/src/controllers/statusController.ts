import { Response } from 'express';
import pool from '../database/db';
import { AuthRequest } from '../middleware/auth';

export const getStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let query = `
      SELECT ws.*, p.name as project_name, p.client, u.name as submitted_by_name
      FROM weekly_status ws
      JOIN projects p ON ws.project_id = p.id
      JOIN users u ON ws.submitted_by = u.id
    `;
    let params: any[] = [];
    let conditions: string[] = [];

    // Delivery Directors can only see their own submissions
    if (user && user.role === 'PDM') {
      conditions.push(`ws.submitted_by = $${params.length + 1}`);
      params.push(user.id);
    }

    // Filter by project
    if (req.query.projectId) {
      conditions.push(`ws.project_id = $${params.length + 1}`);
      params.push(req.query.projectId);
    }

    // Filter by status
    if (req.query.status) {
      conditions.push(`ws.overall_status = $${params.length + 1}`);
      params.push(req.query.status);
    }

    // Filter by week
    if (req.query.weekEndingDate) {
      conditions.push(`ws.week_ending_date = $${params.length + 1}`);
      params.push(req.query.weekEndingDate);
    }

    // Exclude drafts by default
    if (req.query.includeDrafts !== 'true') {
      conditions.push('ws.is_draft = FALSE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ws.week_ending_date DESC, p.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get statuses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLatestStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    let query = `
      SELECT DISTINCT ON (p.id)
        ws.*, p.name as project_name, p.client, u.name as submitted_by_name
      FROM projects p
      LEFT JOIN weekly_status ws ON p.id = ws.project_id AND ws.is_draft = FALSE
      LEFT JOIN users u ON ws.submitted_by = u.id
    `;
    let params: any[] = [];

    // Delivery Directors see only their assigned projects
    if (user && user.role === 'PDM') {
      query += ' WHERE p.assigned_pdm = $1';
      params.push(user.id);
    }

    query += ` ORDER BY p.id, ws.week_ending_date DESC NULLS LAST`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get latest statuses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLatestStatusByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const query = `
      SELECT ws.*, u.name as submitted_by_name
      FROM weekly_status ws
      LEFT JOIN users u ON ws.submitted_by = u.id
      WHERE ws.project_id = $1 AND ws.is_draft = FALSE
      ORDER BY ws.week_ending_date DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No status found for this project' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get latest status by project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let query = `
      SELECT ws.*, p.name as project_name, p.client, u.name as submitted_by_name
      FROM weekly_status ws
      JOIN projects p ON ws.project_id = p.id
      JOIN users u ON ws.submitted_by = u.id
      WHERE ws.id = $1
    `;
    let params: any[] = [id];

    // Delivery Directors can only see their own submissions
    if (user && user.role === 'PDM') {
      query += ' AND ws.submitted_by = $2';
      params.push(user.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Status not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({ message: 'User context required for this operation' });
    }

    const {
      projectId,
      weekEndingDate,
      overallStatus,
      allIsWell,
      risks,
      opportunities,
      valueProjects,
      actionItems,
      isDraft,
    } = req.body;

    if (!projectId || !weekEndingDate || !overallStatus || !allIsWell) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify Delivery Director is assigned to this project
    if (user && user.role === 'PDM') {
      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND assigned_pdm = $2',
        [projectId, user.id]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized for this project' });
      }
    }

    const result = await pool.query(
      `INSERT INTO weekly_status
       (project_id, week_ending_date, overall_status, all_is_well, risks,
        opportunities, value_projects, action_items, submitted_by, is_draft)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (project_id, week_ending_date)
       DO UPDATE SET
         overall_status = EXCLUDED.overall_status,
         all_is_well = EXCLUDED.all_is_well,
         risks = EXCLUDED.risks,
         opportunities = EXCLUDED.opportunities,
         value_projects = EXCLUDED.value_projects,
         action_items = EXCLUDED.action_items,
         is_draft = EXCLUDED.is_draft,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        projectId,
        weekEndingDate,
        overallStatus,
        allIsWell,
        risks,
        opportunities,
        valueProjects,
        actionItems,
        user.id,
        isDraft || false,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(400).json({ message: 'User context required for this operation' });
    }

    const {
      overallStatus,
      allIsWell,
      risks,
      opportunities,
      valueProjects,
      actionItems,
      isDraft,
    } = req.body;

    // Check ownership for Delivery Directors
    if (user && user.role === 'PDM') {
      const ownerCheck = await pool.query(
        'SELECT id FROM weekly_status WHERE id = $1 AND submitted_by = $2',
        [id, user.id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized to update this status' });
      }
    }

    const result = await pool.query(
      `UPDATE weekly_status
       SET overall_status = COALESCE($1, overall_status),
           all_is_well = COALESCE($2, all_is_well),
           risks = COALESCE($3, risks),
           opportunities = COALESCE($4, opportunities),
           value_projects = COALESCE($5, value_projects),
           action_items = COALESCE($6, action_items),
           is_draft = COALESCE($7, is_draft),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [overallStatus, allIsWell, risks, opportunities, valueProjects, actionItems, isDraft, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Status not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(400).json({ message: 'User context required for this operation' });
    }

    // Check ownership for Delivery Directors
    if (user && user.role === 'PDM') {
      const ownerCheck = await pool.query(
        'SELECT id FROM weekly_status WHERE id = $1 AND submitted_by = $2',
        [id, user.id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized to delete this status' });
      }
    }

    const result = await pool.query(
      'DELETE FROM weekly_status WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Status not found' });
    }

    res.json({ message: 'Status deleted successfully' });
  } catch (error) {
    console.error('Delete status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPreviousStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    let query = `
      SELECT ws.*
      FROM weekly_status ws
      JOIN projects p ON ws.project_id = p.id
      WHERE ws.project_id = $1 AND ws.is_draft = FALSE
    `;
    let params: any[] = [projectId];

    // Delivery Directors can only get their own previous submissions
    if (user && user.role === 'PDM') {
      query += ' AND ws.submitted_by = $2';
      params.push(user.id);
    }

    query += ' ORDER BY ws.week_ending_date DESC LIMIT 1';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No previous status found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get previous status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
