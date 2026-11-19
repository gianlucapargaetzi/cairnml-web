import {Component, computed, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ServingEndpoint} from '@common/serving/serving-endpoint.model';
import {ContainerInfo} from '~/business-logic/model/serving/containerInfo';

@Component({
  selector: 'sm-search-result-model-endpoint',
  imports: [
    ResultLineComponent,
    TimeAgoPipe
  ],
  templateUrl: './search-result-model-endpoint.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultModelEndpointComponent {

  entity = input<ServingEndpoint | ContainerInfo>()
  // only a container entry carries its preprocess artifact; an endpoint summary does not
  protected readonly preprocessArtifact = computed(() => (this.entity() as ContainerInfo)?.preprocess_artifact);
  modelEndpointSelected = output<ServingEndpoint | ContainerInfo>();
}
