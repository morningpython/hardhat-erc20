const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('Roles & UUPS protection', function () {
  async function ensureAttach(factory) {
    if (!factory.attach) {
      factory.attach = (address) => ethers.getContractAt(factory.interface, address);
    }
    return factory;
  }
  it('should only allow MINTER_ROLE to mint in upgradeable token', async function () {
    const [owner, other] = await ethers.getSigners();
    const initialSupply = ethers.parseEther('1000');
    const cap = ethers.parseEther('2000');
    const Jaja = await ensureAttach(await ethers.getContractFactory('JajaTokenUpgradeable'));
    const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
      initializer: 'initialize',
    });
    await jaja.waitForDeployment();

    await expect(jaja.connect(other).mint(other.address, 1)).to.be.revertedWith(
      'JajaToken: must have MINTER_ROLE to mint'
    );

    const MINTER_ROLE = await jaja.MINTER_ROLE();
    await jaja.connect(owner).grantRole(MINTER_ROLE, other.address);
    await jaja.connect(other).mint(other.address, ethers.parseEther('1'));
    expect((await jaja.balanceOf(other.address)) > 0n).to.equal(true);
  });

  it('should only allow owner to authorize upgrades (UUPS) for token and vesting', async function () {
    const [owner, other] = await ethers.getSigners();
    const initialSupply = ethers.parseEther('1000');
    const cap = ethers.parseEther('2000');
    const Jaja = await ensureAttach(await ethers.getContractFactory('JajaTokenUpgradeable'));
    const tokenProxy = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
      initializer: 'initialize',
    });
    await tokenProxy.waitForDeployment();

    const JajaV2 = await ensureAttach(await ethers.getContractFactory('JajaTokenV2Upgradeable'));
    const impl = await JajaV2.deploy();
    await impl.waitForDeployment();

    // Non-owner should not be able to upgrade via upgradeTo on proxy (should revert)
    const proxyAsUUPS = new ethers.Contract(
      tokenProxy.address,
      ['function upgradeTo(address) external'],
      other
    );
    await expect(proxyAsUUPS.upgradeTo(impl.address)).to.be.reverted;

    // Owner should be able to upgrade using the upgrades plugin
    await upgrades.upgradeProxy(tokenProxy.address, JajaV2);
    const upgraded = await JajaV2.attach(tokenProxy.address);
    expect(await upgraded.getVersion()).to.equal('v2');
  });

  it('should enforce PAUSER_ROLE for pause/unpause', async function () {
    const [owner, other] = await ethers.getSigners();
    const initialSupply = ethers.parseEther('1000');
    const cap = ethers.parseEther('2000');
    const Jaja = await ensureAttach(await ethers.getContractFactory('JajaTokenUpgradeable'));
    const jaja = await upgrades.deployProxy(Jaja, [initialSupply, cap], {
      initializer: 'initialize',
    });
    await jaja.waitForDeployment();

    await expect(jaja.connect(other).pause()).to.be.revertedWith(
      'JajaToken: must have PAUSER_ROLE to pause'
    );
    const PAUSER_ROLE = await jaja.PAUSER_ROLE();
    await jaja.connect(owner).grantRole(PAUSER_ROLE, other.address);
    await jaja.connect(other).pause();
    await expect(jaja.connect(other).transfer(other.address, 1)).to.be.revertedWithCustomError(
      jaja,
      'EnforcedPause'
    );
    await jaja.connect(other).unpause();
  });
});
