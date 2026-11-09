import React from 'react';
import { useContract } from '../hooks/useContract';
import { getCertificate } from '../services/contractService';
import { WalletSearchInput } from '../components/screen3/WalletSearchInput';
import { CertificateList } from '../components/screen3/CertificateList';

export const CertificatePage: React.FC = () => {
  const { contract } = useContract();

  // TODO: Implement logic here (search and display on-chain task certificates)
  void contract;
  void getCertificate;

  return (
    <main>
      <h1>Certificates</h1>
      <WalletSearchInput />
      <CertificateList />
    </main>
  );
};
