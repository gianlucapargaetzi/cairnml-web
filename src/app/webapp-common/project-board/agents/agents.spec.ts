import {agentRows} from './agents';

describe('agentRows', () => {
  const queues = [{id: 'q1', name: 'default', waiting: 2}, {id: 'q2', name: 'gpu', waiting: 1}];

  it('lists only the agents that listen on a queue of the project, busy ones first', () => {
    const view = agentRows(queues, [
      {id: 'b-idle', queues: [{id: 'q1'}]},
      {id: 'a-busy', queues: [{id: 'q1'}, {id: 'q2'}, {id: 'other'}], task: {id: 't', name: 'train'}},
      {id: 'elsewhere', queues: [{id: 'other'}]},
    ]);
    expect(view.agents.map(agent => agent.name)).toEqual(['a-busy', 'b-idle']);
    expect(view.agents[0]).toEqual({name: 'a-busy', busy: true, task: 'train', queues: ['default', 'gpu']});
    expect(view.idle).toBe(1);
    expect(view.waiting).toBe(3);
  });

  it('has no agents when none listens', () => {
    expect(agentRows(queues, []).agents).toEqual([]);
    expect(agentRows([], []).waiting).toBe(0);
  });
});
