import {packagesMessage} from './packages-message';

describe('packagesMessage', () => {
  it('says that no packages are installed when the recorded requirements are empty', () => {
    expect(packagesMessage('', true)).toBe('No packages will be installed');
    expect(packagesMessage('', false)).toBe('No packages will be installed');
  });

  it('says that packages come from the requirements file of the repository when there is a repository', () => {
    expect(packagesMessage(undefined, true)).toBe('Packages will be installed from repository requirements.txt');
    expect(packagesMessage(null, true)).toBe('Packages will be installed from repository requirements.txt');
  });

  it('does not name a repository when the task has none and no requirements are recorded', () => {
    expect(packagesMessage(undefined, false)).toBe('No packages recorded for this task');
    expect(packagesMessage(null, false)).toBe('No packages recorded for this task');
    expect(packagesMessage(undefined, false)).not.toMatch(/repository/i);
  });
});
