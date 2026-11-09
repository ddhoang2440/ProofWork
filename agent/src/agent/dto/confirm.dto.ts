import { IsNumber } from 'class-validator';

export class ConfirmTaskDto {
  @IsNumber()
  taskId: number;
}
