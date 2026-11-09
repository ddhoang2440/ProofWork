import React from 'react';

export interface EventToastProps {
  message?: string | null;
}

export const EventToast: React.FC<EventToastProps> = ({ message }) => {
  // TODO: Implement logic here
  if (!message) return null;
  return <div role="status">{message}</div>;
};
