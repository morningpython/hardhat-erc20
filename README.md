# JaJa Token (Hardhat ERC20)

This project is a minimal Hardhat project demonstrating an ERC20 token (JaJa Token). It includes a simple `JajaToken` contract (OpenZeppelin), a deploy script, and tests.

## Quick start

1. Install dependencies:

```powershell
npm install
```

1. Compile contracts:

```powershell
npm run compile
```

1. Run tests:

```powershell
npm test
```

1. Run a local Hardhat node and deploy:

```powershell
```powershell
npx hardhat node
# In a separate terminal
npm run deploy
```
```

## Files

- `contracts/JajaToken.sol` — ERC20 token using OpenZeppelin (Burnable, Pausable, Capped).
- `contracts/JajaTokenUpgradeable.sol` — Upgradeable token (UUPS) with AccessControl (MINTER/PAUSER roles).
- `contracts/TokenVesting.sol` — simple linear vesting contract for ERC20 tokens.
- `contracts/TokenVestingUpgradeable.sol` — Upgradeable vesting contract (UUPS).
- `scripts/deploy.js` — deployment script (deploys with initial supply and cap).
- `scripts/deploy_upgradeable.js` — deploy upgradeable proxy (UUPS) using OpenZeppelin Upgrades plugin.
- `scripts/deploy_upgradeable_vesting.js` — deploy upgradeable vesting contract (UUPS) and token together.
- `scripts/deploy_impl_token_v2.js` — deploy token implementation (V2) only.
- `scripts/deploy_impl_vesting_v2.js` — deploy vesting implementation (V2) only.
- `scripts/deploy_impls_and_upgrade.js` — optionally deploy new implementation(s) and upgrade provided proxies.
- `scripts/upgrade_token_v2.js` — upgrades token proxy to V2 using UUPS pattern.
- `scripts/upgrade_vesting_v2.js` — upgrades vesting proxy to V2 using UUPS pattern.
- `scripts/verify_proxy.js` — verify the implementation behind a proxy on Etherscan.
- `test/JajaToken.test.js` — tests for deployment, cap, burn, pause and upgradeability.
- `test/Vesting.test.js` — tests verifying linear vesting release after cliff and duration, revocation, and upgradeability.
- `test/VestingUpgradeable.test.js` — tests for upgradeable vesting proxy behavior and upgrade.
- `frontend/` — minimal Next.js frontend to interact with token and vesting contracts.
- `hardhat.config.js` — Hardhat config.

## Notes

- Adjust `initialSupply` and add any custom functionality (burn, pausable, governance, vesting, etc.) as needed.
To deploy upgradeable vesting use `npm run deploy:upgradeable:vesting` to run `scripts/deploy_upgradeable_vesting.js`.
Access control: Upgradeable token uses `MINTER_ROLE` and `PAUSER_ROLE` (deploying account gets both by default).

## Upgrading Proxies (UUPS)

After you deploy a proxy you can upgrade the implementation using scripts included here.

1. Deploy the proxy as usual and copy its address.
2. Set `PROXY_ADDRESS` environment variable to the proxy address and run the upgrade script (local hardhat node example):

```powershell
set PROXY_ADDRESS=0xYourProxyAddressHere
npm run upgrade:token:v2
```

For vesting proxy upgrade:
```powershell
set PROXY_ADDRESS=0xVestingProxyAddressHere
npm run upgrade:vesting:v2
```

To deploy a V2 implementation and automatically verify it on Etherscan (if `ETHERSCAN_API_KEY` is set):

```powershell
set ETHERSCAN_API_KEY=YourApiKey
npm run deploy:impl:token
```

To deploy and automatically verify vesting implementation:

```powershell
set ETHERSCAN_API_KEY=YourApiKey
npm run deploy:impl:vesting
```

To deploy a V2 implementation and then upgrade a given proxy automatically:

```powershell
set PROXY_TOKEN=0xYourTokenProxyAddress
set PROXY_VESTING=0xYourVestingProxyAddress
npm run deploy:impls:and-upgrade
```

The scripts are also suitable for CI/CD; make sure you set the appropriate env variables.

## Etherscan verification

If you'd like to verify contracts on Etherscan from CI or locally, set the `ETHERSCAN_API_KEY` environment variable and `VERIFY_PROXY_ADDRESS` (proxy address) in the repository secrets. The CI workflow will attempt to verify the implementation contract behind the proxy.

Local example:
```powershell
set ETHERSCAN_API_KEY=YourApiKey
set PROXY_ADDRESS=0xYourProxyAddr
npm run verify:proxy
```

PowerShell notes: if you get a "scripts is disabled on this system" or similar error, run PowerShell as Administrator and use:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```
Lint and format (run these commands locally):

```powershell
cd c:\workspace\hardhat-erc20
npm ci
npm run lint:fix
npm run format
npm test

cd frontend
npm ci
npm run lint
npm run format
npm run dev
```


This enables running local `npm` scripts from PowerShell if the policy is causing the error.

## CI (GitHub Actions)

A CI workflow is included at `.github/workflows/ci.yml` which runs tests and builds the frontend on push and pull request.


## VS Code Tips (font & UI size)

- Toggle Zen Mode (hide activity bar, side bar): `Ctrl+K Z`.
- Temporarily hide the side bar: `Ctrl+B` (this enlarges the editor area).
- Use `F11` for full screen.

If you want to adjust the editor font and UI size, edit the workspace `settings.json` at `.vscode/settings.json`. Example:

```json
{
  "editor.fontSize": 18,

- For production, add security checks, overflow protection, role-based access, and optimization.
  "workbench.activityBar.visible": true,
  "workbench.statusBar.visible": true
}
```

Tip: I added a workspace-level `settings.json` in `.vscode/` that increases font size and restores UI chrome for readability. If you want it even bigger, change `editor.fontSize` to `20` or `22`.

If you prefer per-language overrides, edit `settings.json` and include per-language settings such as:

```json
{
  "[javascript]": {
    "editor.fontSize": 16
  },
  "[solidity]": {
    "editor.fontSize": 18
  }
}
```
- For production, add security checks, overflow protection, role-based access, and optimization.
