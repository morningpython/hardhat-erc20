const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenVestingUpgradeable", function () {
  async function ensureAttach(factory) {
    if (!factory.attach) {
      factory.attach = (address) => ethers.getContractAt(factory.interface.format('json'), address);
    }
    return factory;
  }
  it("should deploy upgradeable vesting and allow release/revoke properly", async function () {
    const [owner, beneficiary, other] = await ethers.getSigners();

    // Deploy upgradeable token
    const initialSupply = ethers.parseEther("1000000");
    const cap = ethers.parseEther("2000000");
    const Jaja = await ensureAttach(await ethers.getContractFactory("JajaTokenUpgradeable"));
    const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], { initializer: 'initialize' });
    await jaja.waitForDeployment();

    // Prepare vesting
    const now = (await ethers.provider.getBlock()).timestamp;
    const cliff = 7 * 24 * 3600; // 7 days
    const duration = 30 * 24 * 3600; // 30 days
    const Vesting = await ensureAttach(await ethers.getContractFactory("TokenVestingUpgradeable"));
    const vesting = await upgrades.deployProxy(Vesting, [jaja.address, beneficiary.address, now, cliff, duration, true], { initializer: 'initialize' });
    await vesting.waitForDeployment();

    // Mint allocation to vesting
    const allocation = ethers.parseEther("10000");
    await jaja.connect(owner).mint(vesting.address, allocation);

    // Move time to after cliff
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 3600]);
    await ethers.provider.send("evm_mine");

    // Releasable should be > 0
    const releasable = await vesting.connect(beneficiary).releasableAmount();
    expect(releasable > 0n).to.equal(true);

    // Release some tokens
    const before = await jaja.balanceOf(beneficiary.address);
    await vesting.connect(beneficiary).release();
    const after = await jaja.balanceOf(beneficiary.address);
    expect(after > before).to.equal(true);

    // Owner can revoke the rest
    const ownerBefore = await jaja.balanceOf(owner.address);
    await vesting.connect(owner).revoke();
    const ownerAfter = await jaja.balanceOf(owner.address);
    expect(ownerAfter > ownerBefore).to.equal(true);
  });

  it("should upgrade vesting contract and keep state", async function () {
    const [owner, beneficiary] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000000");
    const cap = ethers.parseEther("2000000");
    const Jaja = await ensureAttach(await ethers.getContractFactory("JajaTokenUpgradeable"));
    const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], { initializer: 'initialize' });
    await jaja.waitForDeployment();

    const now = (await ethers.provider.getBlock()).timestamp;
    const cliff = 7 * 24 * 3600; // 7 days
    const duration = 30 * 24 * 3600; // 30 days
    const Vesting = await ensureAttach(await ethers.getContractFactory("TokenVestingUpgradeable"));
    const vesting = await upgrades.deployProxy(Vesting, [jaja.address, beneficiary.address, now, cliff, duration, true], { initializer: 'initialize' });
    await vesting.waitForDeployment();

    const allocation = ethers.parseEther("10000");
    await jaja.connect(owner).mint(vesting.address, allocation);

    // Move time to after cliff and release some
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 3600]);
    await ethers.provider.send("evm_mine");
    await vesting.connect(beneficiary).release();

    // Upgrade vesting to V2
    const VestingV2 = await ensureAttach(await ethers.getContractFactory("TokenVestingV2Upgradeable"));
    const upgraded = await upgrades.upgradeProxy(vesting.address, VestingV2);
    expect(await upgraded.getVersion()).to.equal("v2");

    // State preserved: released amount remains the same
    expect(await upgraded.released()).to.equal(await vesting.released());
  });
});
