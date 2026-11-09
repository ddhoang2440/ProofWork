import { Contract } from 'ethers';

export interface ContractEventHandlers {
  onGroupCreated?: (groupId: bigint, name: string, creator: string) => void;
  onTaskCreated?: (taskId: bigint, creator: string, title: string) => void;
  onEvidenceSubmitted?: (taskId: bigint, proofHash: string, submitter: string) => void;
  onTaskConfirmed?: (taskId: bigint, confirmedBy: string) => void;
  onTaskRejected?: (taskId: bigint, rejectedBy: string, reason: string) => void;
}

export function subscribeEvents(
  contract: Contract,
  handlers: ContractEventHandlers
): void {
  // TODO: Implement logic here
  if (handlers.onGroupCreated) {
    void contract.on('GroupCreated', handlers.onGroupCreated);
  }
  if (handlers.onTaskCreated) {
    void contract.on('TaskCreated', handlers.onTaskCreated);
  }
  if (handlers.onEvidenceSubmitted) {
    void contract.on('EvidenceSubmitted', handlers.onEvidenceSubmitted);
  }
  if (handlers.onTaskConfirmed) {
    void contract.on('TaskConfirmed', handlers.onTaskConfirmed);
  }
  if (handlers.onTaskRejected) {
    void contract.on('TaskRejected', handlers.onTaskRejected);
  }
}

export function unsubscribeAll(contract: Contract): void {
  // TODO: Implement logic here
  void contract.removeAllListeners();
}
