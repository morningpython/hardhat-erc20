const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenVesting edge cases", function () {
  it("should revert when duration is zero or cliff > duration", async function () {
    const [owner, beneficiary] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000000");
    const cap = ethers.parseEther("2000000");
    const Jaja = await ethers.getContractFactory("JajaToken");
    const jaja = await Jaja.deploy(initialSupply, cap);
    await jaja.waitForDeployment();

    const now = (await ethers.provider.getBlock()).timestamp;
    const Vesting = await ethers.getContractFactory("TokenVesting");

    await expect(Vesting.deploy(jaja.address, beneficiary.address, now, 10, 0, false)).to.be.revertedWith("Vesting: duration is 0");
    await expect(Vesting.deploy(jaja.address, beneficiary.address, now, 100, 10, false)).to.be.revertedWith("Vesting: cliff > duration");
  });

  it("should revert revoke when not revocable", async function () {
    const [owner, beneficiary] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    const cap = ethers.parseEther("2000");
    const Jaja = await ethers.getContractFactory("JajaToken");
    const jaja = await Jaja.deploy(initialSupply, cap);
    await jaja.waitForDeployment();

    const now = (await ethers.provider.getBlock()).timestamp;
    const cliff = 7 * 24 * 3600;
    const duration = 30 * 24 * 3600;
    const Vesting = await ethers.getContractFactory("TokenVesting");
    const vesting = await Vesting.deploy(jaja.address, beneficiary.address, now, cliff, duration, false);
    await vesting.waitForDeployment();

    await expect(vesting.revoke()).to.be.revertedWith("Vesting: not revocable");
  });
});
