import {selectionDisabledDelete} from './items.utils';

describe('selectionDisabledDelete', () => {
  const task = (status: string, extra: Record<string, unknown> = {}) => ({
    id: `task-${status}`,
    status,
    company: {id: 'company'},
    ...extra
  });

  it('allows deleting created, queued, stopped, completed and failed tasks', () => {
    const tasks = ['created', 'queued', 'stopped', 'completed', 'failed'].map(status => task(status));
    const result = selectionDisabledDelete(tasks);
    expect(result.selectedFiltered).toEqual(tasks);
    expect(result.disable).toBeFalse();
    expect(result.available).toBe(5);
  });

  it('does not allow deleting a running task', () => {
    const result = selectionDisabledDelete([task('in_progress')]);
    expect(result.selectedFiltered).toEqual([]);
    expect(result.disable).toBeTrue();
  });

  it('skips running tasks in a mixed selection', () => {
    const completed = task('completed');
    const result = selectionDisabledDelete([task('in_progress'), completed]);
    expect(result.selectedFiltered).toEqual([completed]);
    expect(result.available).toBe(1);
  });

  it('does not allow deleting read-only tasks', () => {
    const result = selectionDisabledDelete([task('completed', {readOnly: true})]);
    expect(result.disable).toBeTrue();
  });
});
