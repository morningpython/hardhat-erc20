const { ethers, upgrades } = require('hardhat');

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    console.error(
      'Please set PROXY_ADDRESS env var to the vesting proxy address to upgrade (e.g., PROXY_ADDRESS=0x...)'
    );
    process.exit(1);
  }

  console.log(`Upgrading vesting proxy at ${proxyAddress}...`);
  const VestingV2 = await ethers.getContractFactory('TokenVestingV2Upgradeable');
  const upgraded = await upgrades.upgradeProxy(proxyAddress, VestingV2);
  console.log('Vesting proxy upgraded! New implementation at:', upgraded.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
