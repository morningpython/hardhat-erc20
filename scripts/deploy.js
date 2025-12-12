const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  const initialSupply = hre.ethers.utils.parseEther('1000000');
  const cap = hre.ethers.utils.parseEther('2000000');

  const Jaja = await hre.ethers.getContractFactory('JajaToken');
  const jaja = await Jaja.deploy(initialSupply, cap);
  await jaja.deployed();

  console.log('JajaToken deployed to:', jaja.address);
  console.log('Total supply:', (await jaja.totalSupply()).toString());

  // Deploy a small vesting as demo (beneficiary is deployer)
  const now = Math.floor(Date.now() / 1000);
  const vestingCliff = 7 * 24 * 3600; // 7 days
  const vestingDuration = 30 * 24 * 3600; // 30 days
  const Vesting = await hre.ethers.getContractFactory('TokenVesting');
  const vesting = await Vesting.deploy(
    jaja.address,
    deployer.address,
    now,
    vestingCliff,
    vestingDuration,
    true
  );
  await vesting.deployed();

  console.log('Vesting contract deployed to:', vesting.address);

  // Mint a small allocation to the vesting contract for demo
  const allocation = hre.ethers.utils.parseEther('10000');
  await jaja.mint(vesting.address, allocation);
  console.log('Vesting allocation minted:', allocation.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
