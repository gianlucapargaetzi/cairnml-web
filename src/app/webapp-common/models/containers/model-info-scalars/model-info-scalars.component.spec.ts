import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PushPipe } from '@ngrx/component';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';

import { ModelInfoScalarsComponent } from './model-info-scalars.component';

describe('ModelInfoScalarsComponent', () => {
  let component: ModelInfoScalarsComponent;
  let fixture: ComponentFixture<ModelInfoScalarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelInfoScalarsComponent],
      providers: [
        provideMockStore({
          initialState: {
            rootProjects: { selectedProject: null, allUsers: [], users: [], extraUsers: [] },
            views: { plotlyReady: true, backdropActive: false, darkTheme: false, tableCardsCollapsed: {} },
          }
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {}, routeConfig: { data: {} } }
          }
        },
        { provide: ApiTasksService, useValue: {} }
      ]
    })
    .compileComponents();

    // The child panels need the full experiment and model stores; this spec checks the container.
    TestBed.overrideComponent(ModelInfoScalarsComponent, {set: {imports: [PushPipe], schemas: [NO_ERRORS_SCHEMA]}});
    fixture = TestBed.createComponent(ModelInfoScalarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
