import { useState, useCallback } from 'react';
import { Contract, JsonRpcSigner } from 'ethers';
import { GROUP_TASK_ABI, GROUP_TASK_ADDRESS } from '../config/contractConfig';
import { connectWallet } from '../services/walletService';

export interface UseContractResult {
  contract: Contract | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
}

export function useContract(): UseContractResult {
  const [contract, setContract] = useState<Contract | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const connect = useCallback(async () => {
    // TODO: Implement logic here (persist connection state, handle errors)
    const connection = await connectWallet();
    const contractInstance = new Contract(
      GROUP_TASK_ADDRESS,
      GROUP_TASK_ABI,
      connection.signer
    );

    setSigner(connection.signer);
    setAddress(connection.address);
    setChainId(connection.chainId);
    setContract(contractInstance);
  }, []);

  return {
    contract,
    signer,
    address,
    chainId,
    connect,
  };
}
