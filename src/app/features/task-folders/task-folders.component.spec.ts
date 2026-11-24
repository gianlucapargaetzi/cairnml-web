import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {TaskFoldersApiService} from './task-folders-api.service';
import {TaskFoldersComponent} from './task-folders.component';

// The template reads the experiments only after it checks error(), so a failed list shows its message and no read throws.
describe('TaskFoldersComponent when the tasks of the project cannot be loaded', () => {
  let reported: unknown[];
  let fixture: ComponentFixture<TaskFoldersComponent>;

  beforeEach(async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [TaskFoldersComponent],
      providers: [
        provideRouter([]),
        {provide: Store, useValue: {select: () => of({projectId: 'p1'}), dispatch: () => undefined}},
        {provide: HeaderMenuService, useValue: {setupProjectHeaderTabs: () => undefined}},
        {
          provide: TaskFoldersApiService,
          useValue: {loadExperiments: () => Promise.reject(new HttpErrorResponse({status: 400, url: '/x'}))},
        },
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TaskFoldersComponent);
  });

  it('shows the error message and reports nothing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Could not load the tasks of this project.');
    expect(reported).toEqual([]);
  });
});
