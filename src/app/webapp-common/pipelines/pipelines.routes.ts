import {Routes} from '@angular/router';
import {PipelinesPageComponent} from '@common/pipelines/pipelines-page/pipelines-page.component';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.types';
import {pipelinesProviders} from './pipelines.providers';

export const routes: Routes = [{
  path: '',
  component: PipelinesPageComponent,
  data: {search: true, staticBreadcrumb:[[{
      name: 'Pipelines',
      type: CrumbTypeEnum.Feature
    }]]},
  providers: pipelinesProviders
}];
