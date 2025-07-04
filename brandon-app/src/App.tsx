import { useState } from 'react';
import { useLogin, usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import './App.css';
import { Connection, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { getDomainKey, NameRegistryState } from '@bonfida/spl-name-service';

export default function App() {
  const [chain, setChain] = useState<'ethereum' | 'solana'>('ethereum');
  const { ready, authenticated, user, logout } = usePrivy();
  const { login } = useLogin();
  const { ready: solanaReady, wallets: solanaWallets } = useSolanaWallets();
  const solanaWallet = solanaWallets && solanaWallets.length > 0 ? solanaWallets[0] : null;

  const handleLogin = () => {
    login({ walletChainType: chain === 'solana' ? 'solana-only' : 'ethereum-only' });
  };

  const disableLogin = !ready || authenticated;

  const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
  const heliusEndpoint = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 64 }}>
      <h2>Login with Privy</h2>
      {!authenticated ? (
        <>
          <div className="chain-switch" style={{ marginBottom: 24 }}>
            <div className="switch-toggle modern">
              <input
                type="checkbox"
                id="chain-toggle"
                checked={chain === 'solana'}
                onChange={() => setChain(chain === 'ethereum' ? 'solana' : 'ethereum')}
                className="switch-input"
              />
              <label className="switch-label" htmlFor="chain-toggle">
                <span className={`switch-option${chain === 'ethereum' ? ' selected' : ''}`}>Ethereum</span>
                <span className={`switch-slider`}></span>
                <span className={`switch-option${chain === 'solana' ? ' selected' : ''}`}>Solana</span>
              </label>
            </div>
          </div>
          <div className="chain-info" style={{ marginBottom: 16, minHeight: 32 }}>
            {chain === 'ethereum' && (
              <div style={{ color: '#6366f1', fontWeight: 500, fontSize: '1.1em' }}>Connect to Ethereum Mainnet</div>
            )}
            {chain === 'solana' && (
              <div style={{ color: '#14f195', fontWeight: 500, fontSize: '1.1em' }}>Connect to Solana Mainnet</div>
            )}
          </div>
          <button
            className={`connect-btn connect-${chain}`}
            style={{ marginTop: 8, minWidth: 180, fontSize: '1.1em', fontWeight: 600, letterSpacing: 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            disabled={disableLogin}
            onClick={handleLogin}
          >
            {!ready ? 'Loading...' : `Connect Wallet`}
          </button>
        </>
      ) : (
        <>
          <div style={{ margin: '24px 0' }}>
            <div>Logged in as:</div>
            <div style={{ fontWeight: 'bold', marginTop: 4 }}>{user?.wallet?.address || 'Unknown Wallet'}</div>
          </div>
          <button
            style={{ minWidth: 160, background: '#f44336', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
            onClick={logout}
          >
            Disconnect Wallet
          </button>
          {/* BEGIN: SNS Transaction Button (easy to remove) */}
          {chain === 'solana' && solanaReady && solanaWallet && (
            <button
              style={{ marginTop: 24, minWidth: 220, background: '#14f195', color: '#222', border: 'none', borderRadius: 4, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
              onClick={async () => {
                try {
                  const connection = new Connection(heliusEndpoint);
                  // 1. Resolve imbibed.sol to a Solana address
                  const { pubkey } = await getDomainKey('imbibed.sol');
                  const { registry } = await NameRegistryState.retrieve(connection, pubkey);
                  const recipient = registry.owner;
                  if (!recipient) {
                    alert('Could not resolve imbibed.sol to a Solana address.');
                    return;
                  }
                  // 2. Get sender public key
                  const sender = solanaWallet.address;
                  if (!sender) {
                    alert('No Solana wallet address found.');
                    return;
                  }
                  // 3. Create transaction
                  const transaction = new Transaction().add(
                    SystemProgram.transfer({
                      fromPubkey: new PublicKey(sender),
                      toPubkey: recipient,
                      lamports: 1000000, // 0.001 SOL
                    })
                  );
                  // 4. Sign and send transaction using Privy wallet
                  const signature = await solanaWallet.sendTransaction(transaction, connection);
                  alert('Transaction sent! Signature: ' + signature);
                } catch (err) {
                  alert('Error sending transaction: ' + (err instanceof Error ? err.message : String(err)));
                }
              }}
            >
              Send SOL to imbibed.sol
            </button>
          )}
          {/* END: SNS Transaction Button */}
        </>
      )}
    </div>
  );
}
