import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {catchError, forkJoin, map, of, switchMap} from 'rxjs';
import {RepoRun, RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {RepoAccessBadgeComponent} from '../../shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {RepositoryRow, repositoryRows} from './repository-rows';

const MOST_REPOSITORIES_WITH_RUNS = 12;

/** The repositories and datasets linked to the project, how the signed-in user reads each and how many runs of the project used it. */
@Component({
  selector: 'sm-repositories-card',
  templateUrl: './repositories-card.component.html',
  styleUrls: ['./repositories-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinner, RepoAccessBadgeComponent],
})
export class RepositoriesCardComponent {
  private readonly repositories = inject(RepositoriesService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  protected readonly rows = rxResource<RepositoryRow[], string>({
    params: () => this.projectId(),
    stream: ({params}) => this.repositories.list(params).pipe(switchMap(repos => !repos.length ? of([]) : forkJoin(
      repos.slice(0, MOST_REPOSITORIES_WITH_RUNS).map(repo => this.repositories.runs(repo.id).pipe(
        catchError(() => of([] as RepoRun[])), map(runs => [repo.id, runs] as const))),
    ).pipe(map(entries => repositoryRows(repos, Object.fromEntries(entries), params))))),
  });
}
