import { BrowserProvider, Eip1193Provider, JsonRpcSigner } from 'ethers';
import { FUJI_CONFIG } from '../config/fujiConfig';

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export interface WalletConnection {
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  address: string;
  chainId: number;
}

export async function connectWallet(): Promise<WalletConnection> {
  if (!window.ethereum) {
    throw new Error('MetaMask / Web3 wallet is not installed.');
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  // TODO: Implement logic here (handle account/network change listeners)
  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
  };
}

export async function switchToFuji(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask / Web3 wallet is not installed.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FUJI_CONFIG.chainIdHex }],
    });
  } catch (error: unknown) {
    // TODO: Implement logic here (handle error code 4902 and call wallet_addEthereumChain)
    console.error('Failed to switch network:', error);
    throw error;
  }
}
