import { Contract, InterfaceAbi, Wallet, WebSocketProvider } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AgentContractContext {
  provider: WebSocketProvider;
  wallet: Wallet;
  contract: Contract;
}

export function loadGroupTaskAbi(): InterfaceAbi {
  const abiPath = path.resolve(__dirname, '../../../shared/abi/GroupTask.json');
  if (fs.existsSync(abiPath)) {
    return JSON.parse(fs.readFileSync(abiPath, 'utf-8')) as InterfaceAbi;
  }
  return [];
}

export function loadGroupTaskAddress(): string {
  if (process.env.CONTRACT_ADDRESS) {
    return process.env.CONTRACT_ADDRESS;
  }
  const addressesPath = path.resolve(__dirname, '../../../shared/addresses.json');
  if (fs.existsSync(addressesPath)) {
    const data = JSON.parse(fs.readFileSync(addressesPath, 'utf-8')) as {
      fuji?: { GroupTask?: string };
    };
    if (data.fuji?.GroupTask) {
      return data.fuji.GroupTask;
    }
  }
  return '0x0000000000000000000000000000000000000000';
}

export function createContractContext(): AgentContractContext {
  const wssUrl =
    process.env.FUJI_WSS_URL || 'wss://api.avax-test.network/ext/bc/C/ws';
  const privateKey =
    process.env.AGENT_PRIVATE_KEY ||
    '0x0000000000000000000000000000000000000000000000000000000000000001';

  const provider = new WebSocketProvider(wssUrl);
  const wallet = new Wallet(privateKey, provider);
  const contract = new Contract(
    loadGroupTaskAddress(),
    loadGroupTaskAbi(),
    wallet,
  );

  return { provider, wallet, contract };
}
