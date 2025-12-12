import WalletButton from './WalletButton';
export default function Header({ signer, setSigner, provider, setProvider }) {
  return (
    <div className="header">
      <h2>JaJa Token (Frontend)</h2>
      <WalletButton
        signer={signer}
        setSigner={setSigner}
        provider={provider}
        setProvider={setProvider}
      />
    </div>
  );
}
