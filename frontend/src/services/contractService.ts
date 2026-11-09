import { Contract, ContractTransactionResponse } from 'ethers';

export enum TaskStatus {
  Pending = 0,
  Submitted = 1,
  Confirmed = 2,
  Rejected = 3,
}

export interface TaskData {
  id: bigint;
  creator: string;
  title: string;
  proofHash: string;
  status: TaskStatus;
}

export interface CertificateData {
  taskId: bigint;
  recipient: string;
  issuedAt: bigint;
  proofHash: string;
}

export async function createGroup(
  contract: Contract,
  name: string,
  members: string[]
): Promise<ContractTransactionResponse> {
  // TODO: Implement logic here
  const tx = (await contract.createGroup(name, members)) as ContractTransactionResponse;
  return tx;
}

export async function createTask(
  contract: Contract,
  groupId: bigint | number,
  title: string
): Promise<ContractTransactionResponse> {
  // TODO: Implement logic here
  const tx = (await contract.createTask(groupId, title)) as ContractTransactionResponse;
  return tx;
}

export async function submitEvidence(
  contract: Contract,
  taskId: bigint | number,
  proofHash: string
): Promise<ContractTransactionResponse> {
  // TODO: Implement logic here
  const tx = (await contract.submitEvidence(taskId, proofHash)) as ContractTransactionResponse;
  return tx;
}

export async function getTask(
  contract: Contract,
  taskId: bigint | number
): Promise<TaskData> {
  // TODO: Implement logic here
  const raw = await contract.getTask(taskId);
  return {
    id: BigInt(raw.id ?? 0),
    creator: String(raw.creator ?? ''),
    title: String(raw.title ?? ''),
    proofHash: String(raw.proofHash ?? ''),
    status: Number(raw.status ?? 0) as TaskStatus,
  };
}

export async function getCertificate(
  contract: Contract,
  taskId: bigint | number
): Promise<CertificateData> {
  // TODO: Implement logic here
  const raw = await contract.getCertificate(taskId);
  return {
    taskId: BigInt(raw.taskId ?? 0),
    recipient: String(raw.recipient ?? ''),
    issuedAt: BigInt(raw.issuedAt ?? 0),
    proofHash: String(raw.proofHash ?? ''),
  };
}
