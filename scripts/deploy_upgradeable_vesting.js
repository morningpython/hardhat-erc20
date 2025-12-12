const { ethers, upgrades } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying upgradeable vesting with account:', deployer.address);

  // You must deploy an ERC20 token to be used as the vesting token first
  const initialSupply = ethers.utils.parseEther('1000000');
  const cap = ethers.utils.parseEther('2000000');
  const Jaja = await ethers.getContractFactory('JajaTokenUpgradeable');
  const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
    initializer: 'initialize',
  });
  await jaja.deployed();

  const now = Math.floor(Date.now() / 1000);
  const cliff = 7 * 24 * 3600;
  const duration = 30 * 24 * 3600;
  const Vesting = await ethers.getContractFactory('TokenVestingUpgradeable');
  const vesting = await upgrades.deployProxy(
    Vesting,
    [jaja.address, deployer.address, now, cliff, duration, true],
    { initializer: 'initialize' }
  );
  await vesting.deployed();

  console.log('Token deployed to:', jaja.address);
  console.log('Vesting deployed to:', vesting.address);

  // mint a small allocation to the vesting contract
  const allocation = ethers.utils.parseEther('10000');
  await jaja.mint(vesting.address, allocation);
  console.log('Minted allocation to vesting:', allocation.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
