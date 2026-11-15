import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideMockStore} from '@ngrx/store/testing';
import {of, throwError} from 'rxjs';
import {RepositoriesService} from '../dataset-git/repositories.service';
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
