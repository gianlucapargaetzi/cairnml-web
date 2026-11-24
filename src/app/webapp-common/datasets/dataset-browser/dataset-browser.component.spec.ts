import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideMockStore} from '@ngrx/store/testing';
import {Observable, of, throwError} from 'rxjs';
import {Repo, RepositoriesService} from '../dataset-git/repositories.service';
import {DatasetDetailsService} from './dataset-details.service';
import {DatasetBrowserComponent} from './dataset-browser.component';

describe('DatasetBrowserComponent when the repository list cannot be read', () => {
  let fixture: ComponentFixture<DatasetBrowserComponent>;
  let component: DatasetBrowserComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetBrowserComponent],
      providers: [
        provideRouter([]),
        provideMockStore({}),
        {
          provide: RepositoriesService,
          useValue: {
            list: () => throwError(() => ({status: 500})),
            runs: () => of([]),
          },
        },
        {provide: DatasetDetailsService, useValue: {details: () => of(null)}},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetBrowserComponent);
    component = fixture.componentInstance;
  });

  it('shows an error in place of the list, and does not announce a count of 0', async () => {
    const counts: number[] = [];
    let failed = 0;
    component.loaded.subscribe(count => counts.push(count));
    component.loadFailed.subscribe(() => failed++);

    for (let i = 0; i < 3; i++) {
      fixture.detectChanges();
      TestBed.tick();
    }
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-id="repositoriesError"]')).not.toBeNull();
    expect(counts).toEqual([]);
    expect(failed).toBe(1);
  });
});

describe('DatasetBrowserComponent when the dataset details or runs cannot be read', () => {
  let reported: unknown[];
  let details: () => Observable<unknown>;
  let runs: () => Observable<unknown>;

  const dataset = {
    id: 'r1',
    key: 'k',
    host: 'example.test',
    path: 'org/data',
    url: 'https://example.test/org/data',
    name: 'data',
    reference: 'org/data',
    roles: ['dataset'],
    owner: 'o',
    owner_name: 'Owner',
    shared: false,
    relation: 'own',
    state: 'ok',
    state_message: '',
    anonymous: false,
    added: null,
    last_used: null,
    last_checked: null,
    projects: [],
    assignments: [],
    access: {state: 'ok', message: '', warning: false, readable: true},
    can_delete: false,
    delete_blocked: null,
    can_share: false,
    can_assign: false,
    credentials: [],
  } as unknown as Repo;

  const badRequest = () => throwError(() => new HttpErrorResponse({status: 400, statusText: 'Bad Request', url: '/x'}));

  const configure = async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [DatasetBrowserComponent],
      providers: [
        provideRouter([]),
        provideMockStore({}),
        {provide: RepositoriesService, useValue: {list: () => of([dataset]), runs: () => runs()}},
        {provide: DatasetDetailsService, useValue: {details: () => details()}},
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatasetBrowserComponent);
    return fixture;
  };

  const settle = async (fixture: ComponentFixture<DatasetBrowserComponent>) => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const element = (fixture: ComponentFixture<DatasetBrowserComponent>) => fixture.nativeElement as HTMLElement;

  const text = (fixture: ComponentFixture<DatasetBrowserComponent>) => element(fixture).textContent ?? '';

  it('shows the details note and reports nothing when the details request fails', async () => {
    details = badRequest;
    runs = () => of([]);
    const fixture = await configure();

    await settle(fixture);

    expect(text(fixture)).toContain('The details of this dataset could not be read.');
    expect(reported).toEqual([]);
  });

  it('shows the runs note and reports nothing when the runs request fails', async () => {
    details = () => of({revision: 'abcdef1234567', metadata: {}, kind: 'own'});
    runs = badRequest;
    const fixture = await configure();

    await settle(fixture);
    const runsTab = Array.from(element(fixture).querySelectorAll<HTMLElement>('.mat-mdc-tab')).find(tab => tab.textContent?.includes('Runs'));
    runsTab?.click();
    await settle(fixture);

    expect(text(fixture)).toContain('The runs of this repository could not be read.');
    expect(reported).toEqual([]);
  });
});

describe('DatasetBrowserComponent when the repository list fails and a dataset is selected', () => {
  let reported: unknown[];

  it('keeps the list error note and reports nothing', async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [DatasetBrowserComponent],
      providers: [
        provideRouter([]),
        provideMockStore({}),
        {provide: RepositoriesService, useValue: {list: () => throwError(() => new HttpErrorResponse({status: 500})), runs: () => of([])}},
        {provide: DatasetDetailsService, useValue: {details: () => of(null)}},
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatasetBrowserComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-id="repositoriesError"]')).not.toBeNull();
    expect(reported).toEqual([]);
  });
});
