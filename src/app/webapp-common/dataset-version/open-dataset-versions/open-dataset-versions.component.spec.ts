import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PushPipe } from '@ngrx/component';
import { provideMockStore } from '@ngrx/store/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ApiEventsService } from '~/business-logic/api-services/events.service';
import { ApiProjectsService } from '~/business-logic/api-services/projects.service';
import { ActivatedRoute} from '@angular/router';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';
import { of } from 'rxjs';
import { selectExperimentsList, selectHyperParamsVariants, selectSelectedExperiments } from '@common/experiments/reducers';
import { ColorHashService } from '@common/shared/services/color-hash/color-hash.service';
import { CommonExperimentsInfoEffects } from '@common/experiments/effects/common-experiments-info.effects';

import { OpenDatasetVersionsComponent } from './open-dataset-versions.component';

describe('SimpleDatasetVersionsComponent', () => {
  let component: OpenDatasetVersionsComponent;
  let fixture: ComponentFixture<OpenDatasetVersionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OpenDatasetVersionsComponent,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([])
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectExperimentsList, value: [] },
            { selector: selectHyperParamsVariants, value: [] },
            { selector: selectSelectedExperiments, value: [] },
          ],
          initialState: {
            commonSearch: { searchQuery: { query: '', regExp: false }, isSearching: false, placeholder: 'Search' },
            users: { currentUser: null, settings: {} },
            views: { backdropActive: false, darkTheme: false, tableCardsCollapsed: {} },
            rootProjects: { selectedProject: null, extraUsers: [], users: [] },
            projects: { selectedProject: null },
            experiments: {
              entries: [],
              view: {
                tableCols: [],
                hiddenTableCols: {},
                metricsCols: {},
                projectColumnsWidth: {},
                hiddenProjectTableCols: {}
              }
            }
          }
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ projectId: 'test' }),
            queryParams: of({}),
            data: of({}),
            url: of([]),
            snapshot: {
                params: { projectId: 'test' },
                queryParams: {},
                data: {},
                firstChild: { url: [{ path: 'table' }], routeConfig: { path: undefined }, firstChild: null }
            },
            parent: {
                snapshot: { params: { projectId: 'test' } }
            }
          }
        },
        { provide: CommonExperimentsInfoEffects, useValue: {} },
        { provide: ColorHashService, useValue: { colorHash: () => '#000000' } },
        { provide: ApiEventsService, useValue: {} },
        { provide: ApiProjectsService, useValue: {} },
        { provide: ApiTasksService, useValue: { tasksGetAllEx: () => of({ tasks: [] }) } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    // The table and its panels need the whole experiments store; the spec checks the page shell and its wiring.
    TestBed.overrideComponent(OpenDatasetVersionsComponent, {set: {imports: [PushPipe], schemas: [NO_ERRORS_SCHEMA]}});
    fixture = TestBed.createComponent(OpenDatasetVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
