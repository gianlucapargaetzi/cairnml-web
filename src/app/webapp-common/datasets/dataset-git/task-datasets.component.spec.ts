import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {throwError} from 'rxjs';
import {RepoAccessService} from '@common/shared/services/repo-access.service';
import {RepositoriesService} from './repositories.service';
import {TaskDatasetsComponent} from './task-datasets.component';

describe('TaskDatasetsComponent when the access of its datasets cannot be read', () => {
  let reported: unknown[];
  let fixture: ComponentFixture<TaskDatasetsComponent>;

  beforeEach(async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [TaskDatasetsComponent],
      providers: [
        provideRouter([]),
        {
          provide: RepoAccessService,
          useValue: {requirement: () => throwError(() => new HttpErrorResponse({status: 400, url: '/x'}))},
        },
        {provide: RepositoriesService, useValue: {}},
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TaskDatasetsComponent);
    fixture.componentRef.setInput('taskId', 'task1');
    fixture.componentRef.setInput('hyperparams', {
      Datasets: {
        'train/kind': {value: 'local'},
        'train/repo': {value: 'https://example.test/org/data.git'},
        'train/commit': {value: 'abc1234'},
      },
    });
  });

  it('shows the dataset link without an access badge, and reports nothing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-id="taskDatasetLink"]')).not.toBeNull();
    expect(el.querySelector('[data-id="assignDatasetCredentials"]')).toBeNull();
    expect(reported).toEqual([]);
  });
});
