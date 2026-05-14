async function main() {
  const headers = { 'x-tenant-id': 'default-tenant' };
  
  const pageRes = await fetch('http://localhost:4002/api/v1/website/public/pages/home', { headers });
  console.log('page:', pageRes.status, await pageRes.text());
}

main();
