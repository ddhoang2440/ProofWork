import React from 'react';
import { shortenAddress } from '../../utils/format';

export interface WalletConnectButtonProps {
  address: string | null;
  onConnect: () => Promise<void>;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  address,
  onConnect,
}) => {
  // TODO: Implement logic here
  return (
    <button type="button" onClick={() => void onConnect()}>
      {address ? shortenAddress(address) : 'Connect Wallet'}
    </button>
  );
};
