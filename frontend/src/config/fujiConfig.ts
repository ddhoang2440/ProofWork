export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const FUJI_CONFIG: NetworkConfig = {
  chainId: 43113,
  chainIdHex: '0xa869',
  chainName: 'Avalanche Fuji Testnet',
  rpcUrl:
    import.meta.env.VITE_FUJI_RPC_URL ||
    'https://api.avax-test.network/ext/bc/C/rpc',
  blockExplorerUrl: 'https://testnet.snowtrace.io',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
};
