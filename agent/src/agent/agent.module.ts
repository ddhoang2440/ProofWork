import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { LlmService } from './llm.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, LlmService],
  exports: [AgentService, LlmService],
})
export class AgentModule {}
