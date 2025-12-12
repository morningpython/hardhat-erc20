# Frontend for JaJa Token (Minimal)

This is a minimal Next.js frontend to interact with the JaJa ERC20 Token and TokenVesting contracts.

Local setup (assuming you have Node.js installed):

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. Run the dev server (connect MetaMask to localhost:8545 Hardhat node):

```powershell
npm run dev
```

3. Open http://localhost:3000 in your browser and connect the wallet.

Important: Update `frontend/utils/config.js` with local contract addresses after deploying with the scripts in this repo.

Upgrade UI: The frontend includes a simple Upgrade UI where the owner can call `upgradeTo(newImpl)` on UUPS proxies (token/vesting). Fill `NEW IMPLEMENTATION ADDRESS` in the Upgrade UI and submit from the owner's connected wallet. This assumes the connected signer is the owner and the proxy is using the UUPS pattern.
