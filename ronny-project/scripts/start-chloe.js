const { GoLogin } = require('gologin');

const GOLOGIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';
const PROFILE_ID = '69c824ce81d2e60c5598ce87'; // chloe-santos-direct

async function start() {
  const GL = new GoLogin({
    token: GOLOGIN_TOKEN,
    profile_id: PROFILE_ID,
  });

  console.log('Starting Chloe profile...');
  const { status, wsUrl } = await GL.start();
  console.log('Profile started!');
  console.log('wsUrl:', wsUrl);
  
  // Keep running
  console.log('Browser is running. Press Ctrl+C to stop.');
  
  // Keep the process alive
  await new Promise(() => {});
}

start().catch(console.error);
