import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Contract, WebSocketProvider } from 'ethers';
import { createContractContext } from '../config/contractConfig';
import { LlmEvaluationResult, LlmService } from './llm.service';
import { EvaluateTaskDto } from './dto/evaluate.dto';

export interface TaskSubmittedEventPayload {
  taskId: number;
  title?: string;
  proofHash: string;
  submitter?: string;
}

@Injectable()
export class AgentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentService.name);
  private provider: WebSocketProvider | null = null;
  private contract: Contract | null = null;

  constructor(private readonly llmService: LlmService) {}

  onModuleInit(): void {
    // Connect only if explicitly enabled or in production
    // TODO: Implement logic here (auto-connect lifecycle & health check)
  }

  async onModuleDestroy(): Promise<void> {
    if (this.provider) {
      await this.provider.destroy();
    }
  }

  connect(): void {
    const context = createContractContext();
    this.provider = context.provider;
    this.contract = context.contract;

    this.logger.log('Connected WebSocketProvider to Avalanche Fuji');

    // TODO: Implement logic here (WebSocket reconnect strategy & exponential backoff)
    // TODO: Implement logic here (backfill missed EvidenceSubmitted events from last processed block)

    void this.contract.on(
      'EvidenceSubmitted',
      (taskId: bigint, proofHash: string, submitter: string) => {
        void this.handleTaskSubmitted({
          taskId: Number(taskId),
          proofHash,
          submitter,
        });
      },
    );
  }

  async handleTaskSubmitted(
    event: TaskSubmittedEventPayload,
  ): Promise<LlmEvaluationResult> {
    this.logger.log(`Handling submitted task #${event.taskId}`);

    const evaluation = await this.llmService.evaluate({
      taskId: event.taskId,
      title: event.title || `Task #${event.taskId}`,
      proofHash: event.proofHash,
    });

    if (evaluation.decision === 'CONFIRM') {
      // TODO: Implement logic here (send confirmCompletion transaction via this.contract)
      this.logger.log(`Task #${event.taskId} confirmed: ${evaluation.reason}`);
    } else {
      // TODO: Implement logic here (send rejectCompletion transaction via this.contract)
      this.logger.log(`Task #${event.taskId} rejected: ${evaluation.reason}`);
    }

    return evaluation;
  }

  async evaluateManual(dto: EvaluateTaskDto): Promise<LlmEvaluationResult> {
    return this.handleTaskSubmitted({
      taskId: dto.taskId,
      title: dto.title,
      proofHash: dto.proofHash,
    });
  }
}
