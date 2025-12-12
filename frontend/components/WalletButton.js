import { ethers } from 'ethers';
import { useState } from 'react';

export default function WalletButton({ signer, setSigner, provider, setProvider }) {
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
    setAddress(await s.getAddress());
  }

  return (
    <div>
      {signer ? (
        <span className="small">Connected: {address}</span>
      ) : (
        <button className="btn" onClick={connect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
