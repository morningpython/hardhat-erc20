const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('JajaToken', function () {
  async function ensureAttach(factory) {
    if (!factory.attach) {
      factory.attach = (address) => ethers.getContractAt(factory.interface.format('json'), address);
    }
    return factory;
  }

  it('should deploy and set initial supply', async function () {
    const [owner, addr1] = await ethers.getSigners();

    const initialSupply = ethers.parseEther('1000000');
    const cap = ethers.parseEther('2000000');
    const Jaja = await ensureAttach(await ethers.getContractFactory('JajaTokenUpgradeable'));
    const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
      initializer: 'initialize',
    });
    await jaja.waitForDeployment();

    expect(await jaja.name()).to.equal('JaJa Token');
    expect(await jaja.symbol()).to.equal('JAJA');
    expect(await jaja.totalSupply()).to.equal(initialSupply);
    expect(await jaja.balanceOf(owner.address)).to.equal(initialSupply);

    // Mint additional tokens as owner (owner has MINTER_ROLE by default)
    await jaja.connect(owner).mint(addr1.address, ethers.parseEther('100'));
    expect(await jaja.balanceOf(addr1.address)).to.equal(ethers.parseEther('100'));

    // Non-minter can't mint
    await expect(jaja.connect(addr1).mint(addr1.address, 1)).to.be.revertedWith(
      'JajaToken: must have MINTER_ROLE to mint'
    );

    // Grant MINTER_ROLE to addr1 and then mint
    const MINTER_ROLE = await jaja.MINTER_ROLE();
    await jaja.connect(owner).grantRole(MINTER_ROLE, addr1.address);
    await jaja.connect(addr1).mint(addr1.address, ethers.parseEther('10'));

    // Pause/unpause requires PAUSER_ROLE in upgradeable token
    await expect(jaja.connect(addr1).pause()).to.be.revertedWith(
      'JajaToken: must have PAUSER_ROLE to pause'
    );
    const PAUSER_ROLE = await jaja.PAUSER_ROLE();
    await jaja.connect(owner).grantRole(PAUSER_ROLE, addr1.address);
    await jaja.connect(addr1).pause();
    await expect(jaja.connect(addr1).transfer(addr1.address, 1)).to.be.revertedWithCustomError(
      jaja,
      'EnforcedPause'
    );
    await jaja.connect(addr1).unpause();
  });

  it('should upgrade token and keep state', async function () {
    const [owner] = await ethers.getSigners();
    const initialSupply = ethers.parseEther('1000000');
    const cap = ethers.parseEther('2000000');
    const Jaja = await ensureAttach(await ethers.getContractFactory('JajaTokenUpgradeable'));
    const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
      initializer: 'initialize',
    });
    await jaja.waitForDeployment();

    expect(await jaja.totalSupply()).to.equal(initialSupply);

    // Deploy V2 and upgrade
    const JajaV2 = await ensureAttach(await ethers.getContractFactory('JajaTokenV2Upgradeable'));
    const upgraded = await upgrades.upgradeProxy(jaja.address, JajaV2);
    expect(await upgraded.getVersion()).to.equal('v2');
    // Existing state preserved
    expect(await upgraded.totalSupply()).to.equal(initialSupply);
  });

  it('should respect cap and burn/pause functionality', async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther('1000000');
    const cap = ethers.parseEther('1100000'); // small cap for testing
    const Jaja = await ethers.getContractFactory('JajaToken');
    const jaja = await Jaja.deploy(initialSupply, cap);
    await jaja.waitForDeployment();

    // Can't mint beyond the cap
    const remaining = cap - initialSupply; // 100k
    await jaja.mint(addr1.address, remaining);
    await expect(jaja.mint(addr2.address, 1)).to.be.revertedWithCustomError(
      jaja,
      'ERC20ExceededCap'
    );

    // Burn decreases balance and totalSupply
    const beforeTotal = await jaja.totalSupply();
    const burnAmount = ethers.parseEther('10');
    await jaja.connect(addr1).burn(burnAmount);
    expect((await jaja.totalSupply()).lt(beforeTotal)).to.equal(true);

    // Only owner can pause/unpause
    await expect(jaja.connect(addr1).pause()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
    await expect(jaja.connect(addr1).unpause()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // Pause blocks transfers
    await jaja.pause();
    await expect(jaja.connect(addr1).transfer(addr2.address, 1)).to.be.revertedWithCustomError(
      jaja,
      'EnforcedPause'
    );
    await jaja.unpause();
    await jaja.connect(addr1).transfer(addr2.address, 1);
  });
});
