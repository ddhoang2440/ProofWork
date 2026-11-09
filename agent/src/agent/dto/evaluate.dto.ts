import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EvaluateTaskDto {
  @IsNumber()
  taskId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  proofHash: string;
}
