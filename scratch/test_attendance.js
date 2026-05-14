import fetch from 'node-fetch';

async function testAttendance() {
  try {
    const res = await fetch('http://localhost:4002/api/v1/attendance/metrics', {
      headers: {
        'x-tenant-id': 'default-tenant-id' // use default or just see if it connects
      }
    });
    
    const text = await res.text();
    console.log('Metrics Response:', res.status, text);

    const sessionsRes = await fetch('http://localhost:4002/api/v1/attendance/sessions', {
      headers: { 'x-tenant-id': 'default-tenant-id' }
    });
    console.log('Sessions Response:', sessionsRes.status, await sessionsRes.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testAttendance();
