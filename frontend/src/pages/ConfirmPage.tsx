import React from 'react';
import { useContract } from '../hooks/useContract';
import { getTask } from '../services/contractService';
import { TaskList } from '../components/screen2/TaskList';

export const ConfirmPage: React.FC = () => {
  const { contract } = useContract();

  // TODO: Implement logic here (load pending tasks and allow confirmation/rejection)
  void contract;
  void getTask;

  return (
    <main>
      <h1>Confirm Task</h1>
      <TaskList />
    </main>
  );
};
