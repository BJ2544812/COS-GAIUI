import express from 'express';
import websiteRoutes from './src/server/routes/website.routes.js';
import { tenantMiddleware } from './src/server/middleware/tenant.middleware.js';

const app = express();
app.use(express.json());
app.use('/api/v1/website', websiteRoutes);

app.listen(4005, () => {
  console.log('Test server started on 4005');
  
  fetch('http://localhost:4005/api/v1/website/public/pages/home', {
    headers: { 'x-tenant-id': 'default-tenant' }
  })
  .then(r => r.text())
  .then(t => {
    console.log('Response:', t);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
});
