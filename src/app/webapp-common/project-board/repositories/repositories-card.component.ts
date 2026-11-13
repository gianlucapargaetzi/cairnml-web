import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {PrimeTemplate} from 'primeng/api';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {catchError, forkJoin, map, of, switchMap} from 'rxjs';
import {RepoRun, RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {TableComponent} from '../../shared/ui-components/data/table/table.component';
import {ISmCol} from '../../shared/ui-components/data/table/table.consts';
import {ShowTooltipIfEllipsisDirective} from '../../shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '../../shared/ui-components/indicators/tooltip/tooltip.directive';
import {CardHeadingComponent} from '../shared/card-heading.component';
import {RepositoryRow, repositoryRows} from './repository-rows';

const MOST_REPOSITORIES_WITH_RUNS = 12;

/** The repositories and datasets linked to the project, how the signed-in user reads each and how many runs of the project used it. */
@Component({
  selector: 'sm-repositories-card',
  templateUrl: './repositories-card.component.html',
  styleUrls: ['./repositories-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardHeadingComponent, MatProgressSpinner, ShowTooltipIfEllipsisDirective, TableComponent, TooltipDirective, PrimeTemplate],
})
export class RepositoriesCardComponent {
  private readonly repositories = inject(RepositoriesService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  /** The name is the last column to collapse: what a repository is called matters more than how many runs used it. */
  protected readonly cols: ISmCol[] = [
    {id: 'name', header: 'Name', sortable: false, collapseOrder: 9},
    {id: 'runs', header: 'Runs', sortable: false, collapseOrder: 1},
  ];

  protected readonly rows = rxResource<RepositoryRow[], string>({
    params: () => this.projectId(),
    stream: ({params}) => this.repositories.list(params).pipe(switchMap(repos => !repos.length ? of([]) : forkJoin(
      repos.slice(0, MOST_REPOSITORIES_WITH_RUNS).map(repo => this.repositories.runs(repo.id).pipe(
        catchError(() => of([] as RepoRun[])), map(runs => [repo.id, runs] as const))),
    ).pipe(map(entries => repositoryRows(repos, Object.fromEntries(entries), params))))),
  });
}
