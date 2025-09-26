import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';

export const getComposio = () => {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY environment variable is not set');
  }
  
  return new Composio({
    apiKey,
  });
};

export const getComposioWithVercel = () => {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY environment variable is not set');
  }

  return new Composio({
    apiKey,
    provider: new VercelProvider(),
  });
};