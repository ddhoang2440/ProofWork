import React from 'react';
import { FUJI_CONFIG } from '../../config/fujiConfig';

export interface ExplorerLinkProps {
  txHashOrAddress: string;
  type?: 'tx' | 'address';
}

export const ExplorerLink: React.FC<ExplorerLinkProps> = ({
  txHashOrAddress,
  type = 'tx',
}) => {
  // TODO: Implement logic here
  const href = `${FUJI_CONFIG.blockExplorerUrl}/${type}/${txHashOrAddress}`;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      View on Explorer
    </a>
  );
};
