import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {Observable, of, throwError} from 'rxjs';
import {Repo, RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {RepositoriesCardComponent} from './repositories-card.component';

describe('RepositoriesCardComponent', () => {
  let fixture: ComponentFixture<RepositoriesCardComponent>;

  const repo = {id: 'r1', name: 'data-repo', roles: []} as unknown as Repo;

  const create = async (runs: Observable<unknown>) => {
    const service = {list: () => of([repo]), runs: () => runs};
    TestBed.configureTestingModule({providers: [provideMockStore({}), {provide: RepositoriesService, useValue: service}]});
    fixture = TestBed.createComponent(RepositoriesCardComponent);
    fixture.componentRef.setInput('projectId', 'p1');
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.componentInstance;
  };

  it('keeps the row and counts no runs when the runs request fails, and logs one warning naming the call', async () => {
    const warn = spyOn(console, 'warn');
    const component = await create(throwError(() => new Error('boom')));

    expect(component['rows'].value()).toEqual([{id: 'r1', name: 'data-repo', roles: '', runs: 0}]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.calls.mostRecent().args[0])).toContain('repositories.get_runs');
    expect(warn.calls.mostRecent().args[1]).toEqual(jasmine.any(Error));
  });

  it('does not log when the runs request succeeds', async () => {
    const warn = spyOn(console, 'warn');
    await create(of([]));

    expect(warn).not.toHaveBeenCalled();
  });
});
