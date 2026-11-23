import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {ApiAccessService} from '~/business-logic/api-services/access.service';
import {DatasetNotice, DatasetNoticesComponent} from './dataset-notices.component';

describe('DatasetNoticesComponent', () => {
  let fixture: ComponentFixture<DatasetNoticesComponent>;
  let notices: DatasetNotice[];
  let accessNotices: jasmine.Spy;
  let accessDismissNotice: jasmine.Spy;

  const notice = (id: string, dataset: string): DatasetNotice => ({
    id, run_id: 'run-1', dataset, project: 'examples', created: '2026-11-23T10:00:00Z',
  });

  function create() {
    fixture = TestBed.createComponent(DatasetNoticesComponent);
    fixture.detectChanges();
    return fixture;
  }

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('[data-id=datasetNotice]'));

  beforeEach(async () => {
    notices = [notice('n1', 'train-data'), notice('n2', 'test-data')];
    accessNotices = jasmine.createSpy('accessNotices').and.callFake(() => of({notices}));
    accessDismissNotice = jasmine.createSpy('accessDismissNotice').and.returnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [DatasetNoticesComponent],
      providers: [
        {provide: ApiAccessService, useValue: {accessNotices, accessDismissNotice}},
        {provide: Store, useValue: {select: () => of('user-1'), dispatch: () => undefined}},
      ],
    }).compileComponents();
  });

  it('shows one notice per notice of the signed-in user', async () => {
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Dataset train-data was published to project examples by your task.');
    expect(rows()[1].textContent).toContain('Dataset test-data was published to project examples by your task.');
  });

  it('stacks at the bottom right, away from the page header buttons', async () => {
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    const stack = fixture.nativeElement.querySelector('[data-id=datasetNotices]') as HTMLElement;
    const box = stack.getBoundingClientRect();
    expect(window.innerHeight - box.bottom).toBe(24);
    expect(window.innerWidth - box.right).toBe(24);
  });

  it('shows nothing when there are no notices', async () => {
    notices = [];
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(rows().length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-id=datasetNotices]')).toBeNull();
  });

  it('dismiss sends the notice id and removes only that notice', async () => {
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-id=dismissDatasetNotice]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(accessDismissNotice).toHaveBeenCalledWith({id: 'n1'});
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('test-data');
  });
});
