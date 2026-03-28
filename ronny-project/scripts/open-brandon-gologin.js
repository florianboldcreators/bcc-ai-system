const { GoLogin } = require('gologin');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

async function main() {
  const GL = new GoLogin({ token: TOKEN });
  
  // List existing profiles
  const profiles = await GL.getProfiles();
  console.log('Existing profiles:');
  profiles.forEach(p => console.log(`- ${p.id}: ${p.name} | proxy: ${JSON.stringify(p.proxy)}`));
}

main().catch(console.error);
