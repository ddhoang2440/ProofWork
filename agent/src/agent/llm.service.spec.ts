import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should confirm when proofHash is non-zero', async () => {
    const result = await service.evaluate({
      taskId: 1,
      title: 'Test Task',
      proofHash: '0x1234',
    });
    expect(result.decision).toBe('CONFIRM');
  });

  it('should reject when proofHash is 0x0', async () => {
    const result = await service.evaluate({
      taskId: 1,
      title: 'Test Task',
      proofHash: '0x0',
    });
    expect(result.decision).toBe('REJECT');
  });
});
