import React from 'react';
import { FUJI_CONFIG } from '../../config/fujiConfig';
import { switchToFuji } from '../../services/walletService';

export interface NetworkGuardProps {
  chainId: number | null;
  children: React.ReactNode;
}

export const NetworkGuard: React.FC<NetworkGuardProps> = ({ chainId, children }) => {
  // TODO: Implement logic here
  const isWrongNetwork = chainId !== null && chainId !== FUJI_CONFIG.chainId;

  if (isWrongNetwork) {
    return (
      <div>
        <p>Please switch to {FUJI_CONFIG.chainName}.</p>
        <button type="button" onClick={() => void switchToFuji()}>
          Switch to Fuji
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
