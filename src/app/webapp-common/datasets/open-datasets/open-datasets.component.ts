import {Component, OnInit, signal} from '@angular/core';
import {PipelinesPageComponent} from '@common/pipelines/pipelines-page/pipelines-page.component';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {
  setBreadcrumbsOptions,
  setDefaultNestedModeForFeature,
  setSelectedProjectId
} from '@common/core/actions/projects.actions';
import {showExampleDatasets} from '../../projects/common-projects.actions';
import {selectShowDatasetExamples} from '../../projects/common-projects.reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {withLatestFrom} from 'rxjs/operators';
import {selectDefaultNestedModeForFeature} from '@common/core/reducers/projects.reducer';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {OpenDatasetCardComponent} from '@common/datasets/open-dataset-card/open-dataset-card.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {ProjectsHeaderComponent} from '@common/projects/dumb/projects-header/projects-header.component';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {PushPipe} from '@ngrx/component';
import {DatasetBrowserComponent} from '@common/datasets/dataset-browser/dataset-browser.component';
import {DatasetEmptyGuideComponent} from '@common/datasets/dataset-empty-guide/dataset-empty-guide.component';

@Component({
  selector: 'sm-open-datasets',
  templateUrl: './open-datasets.component.html',
  styleUrls: ['./open-datasets.component.scss'],
  imports: [
    DotsLoadMoreComponent,
    OpenDatasetCardComponent,
    ButtonToggleComponent,
    ProjectsHeaderComponent,
    MatIconModule,
    FormsModule,
    PushPipe,
    DatasetBrowserComponent,
    DatasetEmptyGuideComponent
  ]
})
export class OpenDatasetsComponent extends PipelinesPageComponent implements OnInit {
  gitDatasetCount = signal(0);
  /** The dataset list has loaded: before that the page shows neither its list nor its empty state. */
  datasetsLoaded = signal(false);

  public override projectCardClicked(project: ProjectsGetAllResponseSingle) {
    this.router.navigate(['simple', project.id, 'tasks'], {relativeTo: this.projectId? this.route.parent.parent: this.route});
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: this.isExample(project)}));
  }

  protected override getName() {
    return EntityTypeEnum.openDataset;
  }

  protected override getDeletePopupEntitiesList() {
    return 'version';
  }

  override noProjectsReRoute() {
    return this.router.navigate(['..', 'datasets'], {relativeTo: this.route});
  }

  public override createExamples() {
    this.store.dispatch(showExampleDatasets());
  }
  override ngOnInit() {
    super.ngOnInit();
    this.showExamples$ = this.store.select(selectShowDatasetExamples);
  }
  override toggleNestedView(nested: boolean) {
    this.store.dispatch(setDefaultNestedModeForFeature({feature: 'datasets', isNested: nested}));

    if (nested) {
      this.router.navigate(['simple', '*', 'projects'], {relativeTo: this.route});
    } else {
      this.router.navigateByUrl('datasets');
    }
  }

  override setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(
      withLatestFrom(this.store.select(selectDefaultNestedModeForFeature))
    ).subscribe(([selectedProject, defaultNestedModeForFeature]) => {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            // the page header already says 'Datasets & Repositories': a crumb with the same text is not shown twice
            name: this.projectId ? 'Datasets' : 'Datasets & Repositories',
            url: defaultNestedModeForFeature['datasets'] ? 'datasets/simple/*/projects' : 'datasets'
          },
          projectsOptions: {
            basePath: 'datasets/simple',
            filterBaseNameWith: ['.datasets'],
            compareModule: null,
            showSelectedProject: selectedProject?.id !== '*',
            ...(selectedProject && selectedProject?.id !== '*' && {selectedProjectBreadcrumb: {name: selectedProject?.basename}})
          }
        }
      }));
    }));
  }
}
