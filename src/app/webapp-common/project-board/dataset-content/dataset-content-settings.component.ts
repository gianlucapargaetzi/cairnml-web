import {ChangeDetectionStrategy, Component, computed, inject, input, WritableSignal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {map} from 'rxjs';
import {RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {datasetSetting} from './dataset-versions';

/** The settings form of a dataset content card: which dataset of the project it follows. */
@Component({
  selector: 'sm-dataset-content-settings',
  template: `
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Dataset</mat-label>
      <mat-select [value]="current() ?? ''" (selectionChange)="choose($event.value)" data-id="datasetChoice">
        @for (repo of datasets.value() ?? []; track repo.id) {
          <mat-option [value]="repo.id">{{ repo.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormField, MatLabel, MatSelect, MatOption],
})
export class DatasetContentSettingsComponent {
  private readonly repositories = inject(RepositoriesService);
  readonly draft = input.required<WritableSignal<Record<string, unknown>>>();
  readonly projectId = input.required<string>();

  protected readonly current = computed(() => datasetSetting(this.draft()()));
  protected readonly datasets = rxResource({
    params: () => this.projectId(),
    stream: ({params}) => this.repositories.list(params).pipe(map(repos => repos.filter(repo => repo.roles.includes('dataset')))),
  });

  protected choose(id: string): void {
    this.draft().update(settings => ({...settings, dataset: id || null}));
  }
}
