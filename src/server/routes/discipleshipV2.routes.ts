import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { DiscipleshipV2Controller } from '../controllers/DiscipleshipV2Controller.js';

export const discipleshipV2Router = Router();

// Apply tenant context and auth to all routes
discipleshipV2Router.use(tenantMiddleware);
discipleshipV2Router.use(authenticateToken);

discipleshipV2Router.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Discipleship V2 Router is working' });
});

// --- Tasks ---
discipleshipV2Router.post('/tasks', DiscipleshipV2Controller.createTask);
discipleshipV2Router.get('/tasks/my-tasks', DiscipleshipV2Controller.getMyTasks);
discipleshipV2Router.get('/tasks/operational', DiscipleshipV2Controller.getOperationalTasks);
discipleshipV2Router.post('/tasks/:id/complete', DiscipleshipV2Controller.completeTask);
discipleshipV2Router.post('/tasks/:id/cancel', DiscipleshipV2Controller.cancelTask);
discipleshipV2Router.post('/tasks/:id/reassign', DiscipleshipV2Controller.reassignTask);

// --- Care Cases ---
discipleshipV2Router.post('/care-cases', DiscipleshipV2Controller.createCareCase);
discipleshipV2Router.get('/care-cases', DiscipleshipV2Controller.getCareCases);
discipleshipV2Router.get('/care-cases/:id', DiscipleshipV2Controller.getCareCase);
discipleshipV2Router.post('/care-cases/:id/close', DiscipleshipV2Controller.closeCareCase);
discipleshipV2Router.post('/care-cases/:careCaseId/logs', DiscipleshipV2Controller.addCareLog);

// --- Mentorship ---
discipleshipV2Router.post('/mentorships/assign', DiscipleshipV2Controller.assignMentor);
discipleshipV2Router.post('/mentorships/:id/reassign', DiscipleshipV2Controller.reassignMentor);
discipleshipV2Router.post('/mentorships/:id/complete', DiscipleshipV2Controller.completeMentorship);
