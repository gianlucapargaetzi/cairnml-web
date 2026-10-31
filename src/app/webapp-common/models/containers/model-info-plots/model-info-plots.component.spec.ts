import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PushPipe } from '@ngrx/component';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';

import { ModelInfoPlotsComponent } from './model-info-plots.component';

describe('ModelInfoPlotComponent', () => {
  let component: ModelInfoPlotsComponent;
  let fixture: ComponentFixture<ModelInfoPlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelInfoPlotsComponent],
      providers: [
        provideMockStore({
          initialState: {
            views: { plotlyReady: true, backdropActive: false, darkTheme: false, tableCardsCollapsed: {} },
            rootProjects: { selectedProject: null, extraUsers: [], users: [] },
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
    TestBed.overrideComponent(ModelInfoPlotsComponent, {set: {imports: [PushPipe], schemas: [NO_ERRORS_SCHEMA]}});
    fixture = TestBed.createComponent(ModelInfoPlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
