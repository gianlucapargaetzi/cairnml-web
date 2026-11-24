import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {throwError} from 'rxjs';
import {RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {DatasetContentSettingsComponent} from './dataset-content-settings.component';

describe('DatasetContentSettingsComponent when the datasets cannot be read', () => {
  let reported: unknown[];
  let fixture: ComponentFixture<DatasetContentSettingsComponent>;

  beforeEach(async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [DatasetContentSettingsComponent],
      providers: [
        {provide: RepositoriesService, useValue: {list: () => throwError(() => new HttpErrorResponse({status: 400, url: '/x'}))}},
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DatasetContentSettingsComponent);
    fixture.componentRef.setInput('draft', signal({}));
    fixture.componentRef.setInput('projectId', 'p1');
  });

  it('shows the datasets note and reports nothing when the list request fails', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('The datasets of this project could not be read.');
    expect(reported).toEqual([]);
  });
});
