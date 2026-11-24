import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {RepoHistory, RepositoriesService} from '../dataset-git/repositories.service';
import {RepositoryHistoryComponent} from './repository-history.component';

describe('RepositoryHistoryComponent', () => {
  let reported: unknown[];
  let history: (id: string) => Observable<RepoHistory>;

  const commit = {
    type: 'commit' as const,
    sha: 'abcdef1234567',
    message: 'Add samples',
    author: 'someone',
    date: '2026-11-01T10:00:00Z',
    newest: true,
    first: false,
    branches: ['main'],
    runs: [],
    lane: 0,
    parent_rows: [],
  };

  const configure = async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [RepositoryHistoryComponent],
      providers: [
        {provide: RepositoriesService, useValue: {history: (id: string) => history(id)}},
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RepositoryHistoryComponent);
    fixture.componentRef.setInput('repositoryId', 'r1');
    return fixture;
  };

  // The resource settles after its request: wait for it, then render the settled state.
  const settle = async (fixture: ComponentFixture<RepositoryHistoryComponent>) => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const element = (fixture: ComponentFixture<RepositoryHistoryComponent>) => fixture.nativeElement as HTMLElement;

  it('shows the history note and reports nothing when the history request fails', async () => {
    history = () => throwError(() => new HttpErrorResponse({status: 400, statusText: 'Bad Request', url: '/x'}));
    const fixture = await configure();

    await settle(fixture);

    expect(element(fixture).querySelector('[data-id="repositoryHistoryError"]')).not.toBeNull();
    expect(reported).toEqual([]);
  });

  it('renders the commits and the gap of a successful history, with no note', async () => {
    const gap = {type: 'gap' as const, count: 3, lane: 0, parent_rows: [-1]};
    const data: RepoHistory = {
      nodes: [commit, gap, {...commit, sha: '1111111222222', newest: false, first: true, parent_rows: []}],
      lane_count: 1,
      total_commits: 5,
      outside_runs: 0,
      limited: false,
    };
    history = () => of(data);
    const fixture = await configure();

    await settle(fixture);

    const root = element(fixture);
    expect(root.querySelectorAll('[data-id="repositoryHistoryCommit"]').length).toBe(2);
    expect(root.querySelectorAll('[data-id="repositoryHistoryGap"]').length).toBe(1);
    expect(root.querySelector('[data-id="repositoryHistoryError"]')).toBeNull();
    expect(reported).toEqual([]);
  });
});
