import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { ApiOrganizationService } from '~/business-logic/api-services/organization.service';
import { ColorHashService } from '@common/shared/services/color-hash/color-hash.service';

import { WorkloadsPageComponent } from './workloads-page.component';

describe('WorkloadsPageComponent', () => {
  let component: WorkloadsPageComponent;
  let fixture: ComponentFixture<WorkloadsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkloadsPageComponent],
      providers: [
        provideMockStore({
          initialState: {
            rootProjects: { selectedProject: null }
          }
        }),
        provideRouter([]),
        { provide: ApiOrganizationService, useValue: {} },
        { provide: ColorHashService, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkloadsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('WorkloadsPageComponent when the workloads request fails', () => {
  let fixture: ComponentFixture<WorkloadsPageComponent>;
  let reported: unknown[];

  beforeEach(async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [WorkloadsPageComponent],
      providers: [
        provideMockStore({
          initialState: {
            rootProjects: { selectedProject: { id: 'p1', name: 'Project' } }
          }
        }),
        provideRouter([]),
        {
          provide: ApiOrganizationService,
          useValue: {
            organizationGetProjectWorkloads: () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request', url: '/x' }))
          }
        },
        { provide: ColorHashService, useValue: {} },
        { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkloadsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the workloads note in place of the empty state, and reports nothing', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('The workloads could not be read.');
    expect(text).not.toContain('No information available');
    expect(reported).toEqual([]);
  });
});
