const hre = require('hardhat');

async function main() {
  const proxyAddr = process.env.PROXY_ADDRESS;
  if (!proxyAddr) {
    console.error('Please set PROXY_ADDRESS env var');
    process.exit(1);
  }

  console.log(`Checking proxy at ${proxyAddr} ...`);
  const impl = await hre.upgrades.erc1967.getImplementationAddress(proxyAddr);
  console.log(`Implementation address: ${impl}`);

  // run verify task
  await hre.run('verify:verify', { address: impl });
  console.log('Verify submitted for implementation contract.');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
