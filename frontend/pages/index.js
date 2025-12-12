import { useEffect, useState } from 'react';
import { config } from '../utils/config';
import { ethers } from 'ethers';

function WalletButton({ signer, setSigner, provider, setProvider, setCurrentAccount }) {
  const [address, setAddress] = useState('');

  async function connect() {
    if (!window.ethereum) {
      alert('MetaMask not detected');
      return;
    }
    const p = new ethers.BrowserProvider(window.ethereum); // ethers v6
    await p.send('eth_requestAccounts', []);
    const s = await p.getSigner();
    setProvider(p);
    setSigner(s);
    const addr = await s.getAddress();
    setAddress(addr);
    if (setCurrentAccount) setCurrentAccount(addr);
  }

  async function disconnect() {
    setSigner(null);
    setProvider(null);
    setAddress('');
    if (setCurrentAccount) setCurrentAccount('');
  }

  return (
    <div>
      {signer ? (
        <span className="small">
          Connected: {address}{' '}
          <button className="btn small" onClick={disconnect} style={{ marginLeft: 8 }}>
            Disconnect
          </button>
        </span>
      ) : (
        <button className="btn" onClick={connect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenName, setTokenName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [balance, setBalance] = useState('');
  const [releasable, setReleasable] = useState('0');
  const [mintAmount, setMintAmount] = useState('100');
  const [newTokenImpl, setNewTokenImpl] = useState('');
  const [newVestingImpl, setNewVestingImpl] = useState('');
  const [txInProgress, setTxInProgress] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [tokenOwner, setTokenOwner] = useState('');
  const [vestingOwner, setVestingOwner] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');

  const tokenAbi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function mint(address,uint256)',
    'function pause()',
    'function unpause()',
    'event Transfer(address indexed, address indexed, uint256)',
  ];

  const vestingAbi = [
    'function releasableAmount() view returns (uint256)',
    'function vestedAmount() view returns (uint256)',
    'function release()',
    'function revoke()',
  ];

  // ABI fragment to perform UUPS upgrade (exposed on implementation, callable on proxy)
  const uupsAbi = ['function upgradeTo(address newImplementation) external'];

  const ownerAbi = ['function owner() view returns (address)'];

  async function loadToken() {
    if (!provider || !config.tokenAddress) return;
    const c = new ethers.Contract(config.tokenAddress, tokenAbi, provider);
    try {
      setTokenName(await c.name());
      setSymbol(await c.symbol());
      setTotalSupply(ethers.formatEther(await c.totalSupply()));
      const signerAddress = signer ? await signer.getAddress() : null;
      if (signerAddress) {
        setBalance(ethers.formatEther(await c.balanceOf(signerAddress)));
      }
      try {
        const ownerAddr = await new ethers.Contract(
          config.tokenAddress,
          ownerAbi,
          provider
        ).owner();
        setTokenOwner(ownerAddr);
      } catch (e) {
        // not all tokens have owner
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadVesting() {
    if (!provider || !config.vestingAddress) return;
    const v = new ethers.Contract(config.vestingAddress, vestingAbi, provider);
    try {
      const r = await v.releasableAmount();
      setReleasable(ethers.formatEther(r));
    } catch (e) {
      console.error(e);
    }
    try {
      const ownerAddr = await new ethers.Contract(
        config.vestingAddress,
        ownerAbi,
        provider
      ).owner();
      setVestingOwner(ownerAddr);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadToken();
    loadVesting();
  }, [provider, signer, currentAccount]);

  // Listen to account changes and network changes to keep the UI in sync
  useEffect(() => {
    if (!window.ethereum) return;
    function handleAccountsChanged(accounts) {
      if (!accounts || accounts.length === 0) {
        setSigner(null);
        setProvider(null);
        setCurrentAccount('');
        return;
      }
      setCurrentAccount(accounts[0]);
      // update provider/signer if possible
      const p = new ethers.BrowserProvider(window.ethereum);
      p.getSigner()
        .then((s) => {
          setSigner(s);
          setProvider(p);
        })
        .catch(() => {});
    }
    function handleChainChanged(_chainId) {
      // reinitialize provider and signer on chain changes
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      p.getSigner()
        .then((s) => setSigner(s))
        .catch(() => {});
      // reload data
      loadToken();
      loadVesting();
    }
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      if (!window.ethereum) return;
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  async function doMint() {
    if (!signer) {
      alert('connect first');
      return;
    }
    setTxInProgress(true);
    const ct = new ethers.Contract(config.tokenAddress, tokenAbi, signer);
    const amt = ethers.parseEther(mintAmount);
    try {
      const tx = await ct.mint(await signer.getAddress(), amt);
      setTxHash(tx.hash);
      setTxStatus('Mint transaction sent');
      await tx.wait();
      setTxStatus('Mint transaction mined');
      await loadToken();
    } catch (err) {
      console.error(err);
      setTxStatus('Mint failed: ' + (err?.message || err));
    } finally {
      setTxInProgress(false);
    }
  }

  async function doRelease() {
    if (!signer) {
      alert('connect first');
      return;
    }
    setTxInProgress(true);
    const ct = new ethers.Contract(config.vestingAddress, vestingAbi, signer);
    try {
      const tx = await ct.release();
      setTxHash(tx.hash);
      setTxStatus('Release transaction sent');
      await tx.wait();
      setTxStatus('Release transaction mined');
      await loadVesting();
    } catch (err) {
      console.error(err);
      alert('Release failed');
    } finally {
      setTxInProgress(false);
    }
  }

  async function doRevoke() {
    if (!signer) {
      alert('connect first');
      return;
    }
    setTxInProgress(true);
    const v = new ethers.Contract(config.vestingAddress, vestingAbi, signer);
    try {
      const tx = await v.revoke();
      setTxHash(tx.hash);
      setTxStatus('Revoke transaction sent');
      await tx.wait();
      setTxStatus('Revoke transaction mined');
      await loadVesting();
    } catch (err) {
      console.error(err);
      alert('Revoke failed: ' + (err?.message || err));
    } finally {
      setTxInProgress(false);
    }
  }

  async function doUpgrade(proxyAddress, newImplementation) {
    if (!signer) {
      alert('connect first');
      return;
    }
    if (!ethers.isAddress(proxyAddress) || !ethers.isAddress(newImplementation)) {
      alert('Invalid address');
      return;
    }
    try {
      setTxInProgress(true);
      const proxyContract = new ethers.Contract(proxyAddress, uupsAbi, signer);
      const tx = await proxyContract.upgradeTo(newImplementation);
      setTxHash(tx.hash);
      setTxStatus('Upgrade transaction sent');
      await tx.wait();
      setTxStatus('Upgrade transaction mined');
      setTxInProgress(false);
    } catch (err) {
      console.error(err);
      alert('Upgrade failed: ' + (err?.message || err));
    } finally {
      setTxInProgress(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h2>JaJa Token (Frontend)</h2>
        <WalletButton
          provider={provider}
          setProvider={setProvider}
          signer={signer}
          setSigner={setSigner}
          setCurrentAccount={setCurrentAccount}
        />
      </div>
      {txStatus && (
        <div className="card">
          <div className="small">
            Status: {txStatus}{' '}
            {txHash ? (
              <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
                ({txHash.slice(0, 10)}...)
              </a>
            ) : (
              ''
            )}
          </div>
        </div>
      )}

      <div className="card">
        <strong>
          {tokenName} ({symbol})
        </strong>
        <div className="small">Total Supply: {totalSupply}</div>
        <div className="small">Your Balance: {balance}</div>
      </div>

      <div className="card">
        <div>
          <input
            className="input"
            type="text"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          <button className="btn" onClick={doMint} disabled={!signer || txInProgress}>
            {txInProgress ? 'Processing...' : 'Mint'}
          </button>
        </div>
      </div>

      <div className="card">
        <strong>Vesting</strong>
        <div className="small">Releasable: {releasable}</div>
        <button className="btn" onClick={doRelease} disabled={!signer || txInProgress}>
          {txInProgress ? 'Processing...' : 'Release'}
        </button>
        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={doRevoke}
          disabled={
            !signer ||
            txInProgress ||
            !currentAccount ||
            (vestingOwner && currentAccount.toLowerCase() !== vestingOwner.toLowerCase())
          }
        >
          Revoke (Owner only)
        </button>
        <div style={{ marginTop: 8 }}>
          <input
            className="input"
            placeholder="New vesting implementation address"
            value={newVestingImpl}
            onChange={(e) => setNewVestingImpl(e.target.value)}
          />
          <button
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => doUpgrade(config.vestingAddress, newVestingImpl)}
            disabled={
              !newVestingImpl ||
              txInProgress ||
              !currentAccount ||
              (vestingOwner && currentAccount.toLowerCase() !== vestingOwner.toLowerCase())
            }
          >
            {txInProgress ? 'Upgrading...' : 'Upgrade Vesting (owner only)'}
          </button>
        </div>
      </div>

      <div className="card">
        <strong>Token Upgrade</strong>
        <div className="small">Upgrade the token proxy to a new implementation by address</div>
        <div style={{ marginTop: 8 }}>
          <input
            className="input"
            placeholder="New token implementation address"
            value={newTokenImpl}
            onChange={(e) => setNewTokenImpl(e.target.value)}
          />
          <button
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => doUpgrade(config.tokenAddress, newTokenImpl)}
            disabled={
              !newTokenImpl ||
              txInProgress ||
              !currentAccount ||
              (tokenOwner && currentAccount.toLowerCase() !== tokenOwner.toLowerCase())
            }
          >
            {txInProgress ? 'Upgrading...' : 'Upgrade Token (owner only)'}
          </button>
        </div>
      </div>
    </div>
  );
}
