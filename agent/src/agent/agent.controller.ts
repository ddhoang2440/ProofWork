import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DemoSecretGuard } from '../common/demo-secret.guard';
import { AgentService } from './agent.service';
import { EvaluateTaskDto } from './dto/evaluate.dto';
import { LlmEvaluationResult } from './llm.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('evaluate')
  @UseGuards(DemoSecretGuard)
  async evaluate(@Body() dto: EvaluateTaskDto): Promise<LlmEvaluationResult> {
    // TODO: Implement logic here (additional request logging or queue dispatch)
    return this.agentService.evaluateManual(dto);
  }
}
