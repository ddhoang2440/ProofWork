import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RejectTaskDto {
  @IsNumber()
  taskId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
