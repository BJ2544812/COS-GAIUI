import { getToken, getTenantId } from './src/lib/authSession.js';

async function main() {
  const loginRes = await fetch('http://localhost:4002/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gracechurch.com', password: 'password' })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  const tenantId = 'default-tenant'; // Hardcode since I know it

  console.log('Login:', loginRes.status, 'Token:', !!token, 'Tenant:', tenantId);

  // 2. Wipe
  const wipeRes = await fetch('http://localhost:4002/api/v1/website/pages', {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId
    }
  });
  console.log('Wipe:', wipeRes.status);

  // 3. Apply
  const applyRes = await fetch('http://localhost:4002/api/v1/website/templates/apply', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId
    },
    body: JSON.stringify({ templateId: 'flagship-1' })
  });
  
  const applyData = await applyRes.json();
  console.log('Apply:', applyRes.status, applyData.status, applyData.data?.length);

  // 4. Get Pages
  const getRes = await fetch('http://localhost:4002/api/v1/website/pages', {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId
    }
  });
  const getData = await getRes.json();
  console.log('Get:', getRes.status, getData.status, getData.data?.length);
}

main();
