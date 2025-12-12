const hre = require('hardhat');

async function main() {
  const JajaV2 = await hre.ethers.getContractFactory('JajaTokenV2Upgradeable');
  const impl = await JajaV2.deploy();
  await impl.deployed();
  console.log('Jaja V2 implementation deployed at:', impl.address);
  if (process.env.ETHERSCAN_API_KEY) {
    try {
      await hre.run('verify:verify', { address: impl.address });
      console.log('Implementation verified on Etherscan');
    } catch (err) {
      console.warn('Verification failed or skipped:', err.message || err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
