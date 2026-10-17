import {groupTaskFolders} from './task-folders.utils';

describe('groupTaskFolders', () => {
  it('groups a local run by its own name', () => {
    const result = groupTaskFolders([
      {id: 'a', name: 'second_run'},
      {id: 'b', name: 'second_run'},
    ]);
    expect(result.folders.map(f => f.name)).toEqual(['second_run']);
    expect(result.folders[0].experiments.map(e => e.id)).toEqual(['a', 'b']);
    expect(result.unassigned).toEqual([]);
  });

  it('puts a clone under the name of the task it was cloned from', () => {
    const result = groupTaskFolders([
      {id: 'template', name: 'train-model'},
      {id: 'run-1', name: 'train-model (copy)', parent: 'template'},
      {id: 'run-2', name: 'train-model (copy)', parent: 'run-1'},
    ]);
    expect(result.folders.map(f => f.name)).toEqual(['train-model']);
    expect(result.folders[0].experiments.map(e => e.id)).toEqual(['template', 'run-1', 'run-2']);
  });

  it('marks an experiment whose parent is outside the list as unassigned', () => {
    const result = groupTaskFolders([
      {id: 'orphan', name: 'stray', parent: 'elsewhere'},
    ]);
    expect(result.folders).toEqual([]);
    expect(result.unassigned.map(e => e.id)).toEqual(['orphan']);
  });

  it('marks an experiment without a name as unassigned', () => {
    const result = groupTaskFolders([
      {id: 'blank', name: '   '},
    ]);
    expect(result.unassigned.map(e => e.id)).toEqual(['blank']);
  });

  it('does not loop on a parent cycle', () => {
    const result = groupTaskFolders([
      {id: 'x', name: 'x', parent: 'y'},
      {id: 'y', name: 'y', parent: 'x'},
    ]);
    expect(result.unassigned.map(e => e.id).sort()).toEqual(['x', 'y']);
  });

  it('sorts folders by name', () => {
    const result = groupTaskFolders([
      {id: '1', name: 'zeta'},
      {id: '2', name: 'alpha'},
    ]);
    expect(result.folders.map(f => f.name)).toEqual(['alpha', 'zeta']);
  });
});
