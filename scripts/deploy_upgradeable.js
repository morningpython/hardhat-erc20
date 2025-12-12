const { ethers, upgrades } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying upgradeable contracts with account:', deployer.address);

  const initialSupply = ethers.utils.parseEther('1000000');
  const cap = ethers.utils.parseEther('2000000');

  const Jaja = await ethers.getContractFactory('JajaTokenUpgradeable');
  console.log('Deploying proxy...');
  const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
    initializer: 'initialize',
  });
  await jaja.deployed();
  console.log('JajaTokenUpgradeable proxy deployed to:', jaja.address);
  console.log('Total supply:', (await jaja.totalSupply()).toString());

  // optional: mint to vesting etc
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
