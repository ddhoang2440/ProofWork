import { Injectable } from '@nestjs/common';
import { ZeroHash } from 'ethers';

export interface TaskEvaluationInput {
  taskId: number;
  title: string;
  proofHash: string;
}

export interface LlmEvaluationResult {
  decision: 'CONFIRM' | 'REJECT';
  reason: string;
}

@Injectable()
export class LlmService {
  async evaluate(task: TaskEvaluationInput): Promise<LlmEvaluationResult> {
    // TODO: Implement logic here (call real LLM API for evidence verification)

    // Mock fallback rule-based: if proofHash is non-empty and not ZeroHash => CONFIRM
    const isZero =
      !task.proofHash ||
      task.proofHash === '0x0' ||
      task.proofHash === ZeroHash;

    if (!isZero) {
      return {
        decision: 'CONFIRM',
        reason: 'Rule-based fallback: valid non-zero proofHash provided.',
      };
    }

    return {
      decision: 'REJECT',
      reason: 'Rule-based fallback: proofHash is empty or zero.',
    };
  }
}
