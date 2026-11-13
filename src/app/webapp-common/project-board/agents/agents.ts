export interface QueueInfo {
  id: string;
  name: string;
  /** Tasks waiting in the queue. */
  waiting: number;
}

export interface WorkerInfo {
  id: string;
  /** The queues the agent listens on. */
  queues: {id?: string}[];
  /** The task it runs now, if any. */
  task?: {id?: string; name?: string} | null;
}

export interface AgentRow {
  name: string;
  busy: boolean;
  /** The name of the task it runs, when busy. */
  task: string;
  /** The names of the project's queues it listens on. */
  queues: string[];
}

export interface AgentsView {
  queues: QueueInfo[];
  agents: AgentRow[];
  idle: number;
  waiting: number;
}

/** The agents that listen on at least one queue of the project (busy first, then by name), and the queues with their waiting tasks. */
export function agentRows(queues: QueueInfo[], workers: WorkerInfo[]): AgentsView {
  const names = new Map(queues.map(queue => [queue.id, queue.name]));
  const agents = workers
    .map(worker => ({
      name: worker.id,
      busy: !!worker.task?.id,
      task: worker.task?.name ?? '',
      queues: (worker.queues ?? []).map(queue => names.get(queue.id ?? '')).filter((name): name is string => !!name),
    }))
    .filter(agent => agent.queues.length > 0)
    .sort((a, b) => Number(b.busy) - Number(a.busy) || a.name.localeCompare(b.name));
  return {
    queues, agents,
    idle: agents.filter(agent => !agent.busy).length,
    waiting: queues.reduce((sum, queue) => sum + queue.waiting, 0),
  };
}
