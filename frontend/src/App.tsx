import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useContract } from './hooks/useContract';
import { WalletConnectButton } from './components/common/WalletConnectButton';
import { NetworkGuard } from './components/common/NetworkGuard';
import { EventToast } from './components/common/EventToast';
import { CreatePage } from './pages/CreatePage';
import { ConfirmPage } from './pages/ConfirmPage';
import { CertificatePage } from './pages/CertificatePage';

export const App: React.FC = () => {
  const { address, chainId, connect } = useContract();

  // TODO: Implement logic here (global event toast subscription)

  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="nav-bar">
          <nav className="nav-links">
            <Link to="/create">Create</Link>
            <Link to="/confirm">Confirm</Link>
            <Link to="/certificates">Certificates</Link>
          </nav>
          <WalletConnectButton address={address} onConnect={connect} />
        </header>

        <EventToast message={null} />

        <NetworkGuard chainId={chainId}>
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/confirm" element={<ConfirmPage />} />
            <Route path="/certificates" element={<CertificatePage />} />
          </Routes>
        </NetworkGuard>
      </div>
    </BrowserRouter>
  );
};

export default App;
