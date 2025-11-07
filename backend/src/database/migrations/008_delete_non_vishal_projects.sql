-- Delete all project data except for projects assigned to Vishal Gadge
-- Vishal Gadge's user ID: 6f69a344-c8a4-473a-85d4-e18d0babea05

BEGIN;

-- Show counts before deletion
SELECT COUNT(*) as total_projects FROM projects;
SELECT COUNT(*) as projects_to_keep FROM projects WHERE assigned_pdm = '6f69a344-c8a4-473a-85d4-e18d0babea05';
SELECT COUNT(*) as projects_to_delete FROM projects WHERE assigned_pdm <> '6f69a344-c8a4-473a-85d4-e18d0babea05';

-- Delete weekly status entries for projects NOT assigned to Vishal Gadge
DELETE FROM weekly_status
WHERE project_id IN (
  SELECT id FROM projects WHERE assigned_pdm <> '6f69a344-c8a4-473a-85d4-e18d0babea05'
);

-- Delete projects NOT assigned to Vishal Gadge
DELETE FROM projects
WHERE assigned_pdm <> '6f69a344-c8a4-473a-85d4-e18d0babea05';

-- Show counts after deletion
SELECT COUNT(*) as remaining_projects FROM projects;
SELECT COUNT(*) as vishals_projects FROM projects WHERE assigned_pdm = '6f69a344-c8a4-473a-85d4-e18d0babea05';

COMMIT;
