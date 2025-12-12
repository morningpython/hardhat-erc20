const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    console.error("Please set PROXY_ADDRESS env var to the proxy address to upgrade (e.g., PROXY_ADDRESS=0x...)");
    process.exit(1);
  }

  console.log(`Upgrading token proxy at ${proxyAddress}...`);
  const JajaV2 = await ethers.getContractFactory("JajaTokenV2Upgradeable");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, JajaV2);
  console.log("Token proxy upgraded! New implementation at:", upgraded.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
