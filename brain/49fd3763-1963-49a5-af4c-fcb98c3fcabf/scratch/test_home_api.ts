async function main() {
  const tid = 'default-tenant-id';
  const url = 'http://localhost:4002/api/v1/website/public/pages/home';
  const res = await fetch(url, {
    headers: { 'x-tenant-id': tid }
  });
  const json = await res.json();
  console.log('--- API RESPONSE FOR HOME ---');
  console.log(JSON.stringify(json, null, 2));
  console.log('Status Code:', res.status);
  console.log('-----------------------------');
}

main().catch(console.error);
