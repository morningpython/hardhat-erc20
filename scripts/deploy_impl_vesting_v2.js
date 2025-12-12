const hre = require('hardhat');

async function main() {
  const VestingV2 = await hre.ethers.getContractFactory('TokenVestingV2Upgradeable');
  const impl = await VestingV2.deploy();
  await impl.deployed();
  console.log('Vesting V2 implementation deployed at:', impl.address);
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
