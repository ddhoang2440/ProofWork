import React from 'react';
import { useContract } from '../hooks/useContract';
import { createGroup, createTask, submitEvidence } from '../services/contractService';
import { CreateGroupForm } from '../components/screen1/CreateGroupForm';
import { CreateTaskForm } from '../components/screen1/CreateTaskForm';
import { SubmitEvidenceForm } from '../components/screen1/SubmitEvidenceForm';

export const CreatePage: React.FC = () => {
  const { contract } = useContract();

  // TODO: Implement logic here (wire form submissions to createGroup, createTask, submitEvidence)
  void contract;
  void createGroup;
  void createTask;
  void submitEvidence;

  return (
    <main>
      <h1>Create Task</h1>
      <CreateGroupForm />
      <CreateTaskForm />
      <SubmitEvidenceForm />
    </main>
  );
};
