const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenVesting", function () {
  it("should vest tokens linearly after the cliff and allow release", async function () {
    const [owner, beneficiary, other] = await ethers.getSigners();

    const initialSupply = ethers.parseEther("1000000");
    const cap = ethers.parseEther("2000000");
    const Jaja = await ethers.getContractFactory("JajaToken");
    const jaja = await Jaja.deploy(initialSupply, cap);
    await jaja.waitForDeployment();

    // Deploy vesting contract with start = now, cliff = 7 days, duration = 30 days
    const now = (await ethers.provider.getBlock()).timestamp;
    const cliff = 7 * 24 * 3600; // 7 days
    const duration = 30 * 24 * 3600; // 30 days
    const Vesting = await ethers.getContractFactory("TokenVesting");
    // Make the vesting revocable by owner (true)
    const vesting = await Vesting.deploy(jaja.address, beneficiary.address, now, cliff, duration, true);
    await vesting.waitForDeployment();

    // Transfer allocation to vesting contract (for example: 10k tokens)
    const allocation = ethers.parseEther("10000");
    await jaja.connect(owner).mint(vesting.address, allocation);

    // Before cliff, no tokens are releasable and non-beneficiary can't release
    await expect(vesting.connect(other).release()).to.be.revertedWith("Vesting: only beneficiary");
    await expect(vesting.connect(beneficiary).release()).to.be.revertedWith("Vesting: no tokens to release");

    // Move time to after cliff but before end (simulate 10 days)
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 3600]);
    await ethers.provider.send("evm_mine");

    const releasableAfterCliff = await vesting.connect(beneficiary).releasableAmount();
    expect(releasableAfterCliff > 0n).to.equal(true);

    // Release some tokens
    const beneficiaryBalanceBefore = await jaja.balanceOf(beneficiary.address);
    await vesting.connect(beneficiary).release();
    const beneficiaryBalanceAfter = await jaja.balanceOf(beneficiary.address);
    expect(beneficiaryBalanceAfter > beneficiaryBalanceBefore).to.equal(true);

    // Non-owner cannot revoke
    await expect(vesting.connect(other).revoke()).to.be.revertedWith("Ownable: caller is not the owner");

    // Owner revokes remaining (after partial release)
    const ownerBalanceBefore = await jaja.balanceOf(owner.address);
    const releasedAfter = await vesting.released();
    // Revoke vesting (expect Revoked event)
    await expect(vesting.connect(owner).revoke()).to.emit(vesting, "Revoked");
    const ownerBalanceAfter = await jaja.balanceOf(owner.address);
    expect(ownerBalanceAfter > ownerBalanceBefore).to.equal(true);

    // Owner cannot revoke again
    await expect(vesting.connect(owner).revoke()).to.be.revertedWith("Vesting: already revoked");

    // Compute vested at revocation and ensure beneficiary can claim only vested amount
    const vestedAtRevocation = await vesting.vestedAmount();
    // Owner received the unvested amount
    const ownerReceived = ownerBalanceAfter - ownerBalanceBefore;
    const unvested = allocation - vestedAtRevocation;
    expect(ownerReceived).to.equal(unvested);
    const releasableAfterRevoke = await vesting.releasableAmount();
    const expectedReleasable = vestedAtRevocation - releasedAfter;
    expect(releasableAfterRevoke).to.equal(expectedReleasable);

    // After revoke, time progression should not increase vested amount beyond revokedAt
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600]);
    await ethers.provider.send("evm_mine");

    // beneficiary should only be able to claim up to vestedAtRevocation (not full allocation)
    await vesting.connect(beneficiary).release();
    const beneficiaryFinal = await jaja.balanceOf(beneficiary.address);
    expect(beneficiaryFinal).to.equal(vestedAtRevocation);
  });

  it("should not allow revoke if not revocable", async function () {
    const [owner, beneficiary] = await ethers.getSigners();

    const initialSupply = ethers.parseEther("1000000");
    const cap = ethers.parseEther("2000000");
    const Jaja = await ethers.getContractFactory("JajaToken");
    const jaja = await Jaja.deploy(initialSupply, cap);
    await jaja.waitForDeployment();

    const now = (await ethers.provider.getBlock()).timestamp;
    const cliff = 7 * 24 * 3600;
    const duration = 30 * 24 * 3600;
    const Vesting = await ethers.getContractFactory("TokenVesting");
    // Not revocable
    const vesting = await Vesting.deploy(jaja.address, beneficiary.address, now, cliff, duration, false);
    await vesting.waitForDeployment();

    // Transfer allocation to vesting
    const allocation = ethers.parseEther("10000");
    await jaja.connect(owner).mint(vesting.address, allocation);

    await expect(vesting.connect(owner).revoke()).to.be.revertedWith("Vesting: not revocable");
  });
});
