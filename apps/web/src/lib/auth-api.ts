import axios from 'axios';

export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const serverMsg = error.response?.data?.error;
    if (typeof serverMsg === 'string' && serverMsg.length > 0) return serverMsg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
