const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const GOLOGIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

async function startProfile(profileId, name) {
  console.log(`Starting profile ${name} (${profileId})...`);
  
  const GL = new GoLogin({
    token: GOLOGIN_TOKEN,
    profile_id: profileId,
    extra_params: ['--no-proxy-server'] // Disable proxy
  });

  try {
    const { status, wsUrl } = await GL.start();
    console.log(`Profile ${name} started!`);
    console.log(`WebSocket: ${wsUrl}`);
    return { GL, wsUrl };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

// Start amy-brown (for Chloe) without proxy
startProfile('69c237157961c960feb0fa71', 'amy-brown-chloe');
