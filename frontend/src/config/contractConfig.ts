import type { InterfaceAbi } from 'ethers';
import groupTaskAbi from '../../../shared/abi/GroupTask.json';
import addresses from '../../../shared/addresses.json';

export const GROUP_TASK_ABI: InterfaceAbi = groupTaskAbi as InterfaceAbi;

export const GROUP_TASK_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  addresses.fuji?.GroupTask ||
  '0x0000000000000000000000000000000000000000';
