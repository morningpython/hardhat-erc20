const hre = require('hardhat');
const { ethers, upgrades } = hre;

async function main() {
  const proxyToken = process.env.PROXY_TOKEN || '';
  const proxyVesting = process.env.PROXY_VESTING || '';

  // Deploy token impl and upgrade current proxy
  if (proxyToken) {
    const JajaV2 = await ethers.getContractFactory('JajaTokenV2Upgradeable');
    const impl = await JajaV2.deploy();
    await impl.deployed();
    console.log('Deployed token impl at:', impl.address);
    // upgrade if proxy provided
    console.log('Upgrading token proxy at:', proxyToken);
    await upgrades.upgradeProxy(proxyToken, JajaV2);
    console.log('Token proxy upgraded to impl:', impl.address);
    // optional verify
    if (process.env.ETHERSCAN_API_KEY) {
      try {
        await hre.run('verify:verify', { address: impl.address });
        console.log('Verified token impl on etherscan');
      } catch (err) {
        console.warn('Token impl verify failed:', err.message || err);
      }
    }
  }

  // Deploy vesting impl and upgrade current proxy
  if (proxyVesting) {
    const VestingV2 = await ethers.getContractFactory('TokenVestingV2Upgradeable');
    const implV = await VestingV2.deploy();
    await implV.deployed();
    console.log('Deployed vesting impl at:', implV.address);
    console.log('Upgrading vesting proxy at:', proxyVesting);
    await upgrades.upgradeProxy(proxyVesting, VestingV2);
    console.log('Vesting proxy upgraded to impl:', implV.address);
    if (process.env.ETHERSCAN_API_KEY) {
      try {
        await hre.run('verify:verify', { address: implV.address });
        console.log('Verified vesting impl on etherscan');
      } catch (err) {
        console.warn('Vesting impl verify failed:', err.message || err);
      }
    }
  }

  if (!proxyToken && !proxyVesting) {
    console.log('No proxy addresses passed via env variables PROXY_TOKEN/PROXY_VESTING. Nothing to upgrade.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
