import type { TaskSnapshot } from '@/lib/types';
import { getMockTaskSnapshot } from './rpc';

export function topicSubscribe(topic: 'task', taskId: string, listener: (data: TaskSnapshot | null) => void): () => void;
export function topicSubscribe(topic: string, arg1: any, listener: (data: any) => void): () => void;
export function topicSubscribe(topic: string, arg1: any, arg2: any, listener: (data: any) => void): () => void;
export function topicSubscribe(topic: string, ...args: any[]) {
  const listener = args[args.length - 1] as (data: any) => void;
  const taskId = String(args[0] || '');
  const emit = () => {
    if (topic === 'task') listener(getMockTaskSnapshot(taskId) satisfies TaskSnapshot | null);
    else if (topic === 'chat.stream') listener({ done: true, delta: 'mock stream finished' });
    else if (topic.includes('smoke_batch')) listener({ total: 20, done: 12, ok: 12, failed: 0 });
    else listener(null);
  };
  window.setTimeout(emit, 20);
  const timer = window.setInterval(emit, 5000);
  return () => window.clearInterval(timer);
}
