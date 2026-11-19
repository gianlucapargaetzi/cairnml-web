import {inject, Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Board} from './board.model';
import {normalizeBoard} from './board-layout';

/** What the server says about a project's board: the saved board (null when it has none) and whether the caller may change it. */
export interface LoadedBoard {
  board: Board | null;
  canEdit: boolean;
}

/** The overview board of a project on the server (`projects.get_overview_board` and `projects.set_overview_board`). */
@Injectable({providedIn: 'root'})
export class BoardService {
  private readonly projects = inject(ApiProjectsService);

  /** The saved board, which is null when the project never saved one (or what is stored cannot be shown), and whether the caller may change it. */
  get(projectId: string): Observable<LoadedBoard> {
    return this.projects.projectsGetOverviewBoard({project: projectId})
      .pipe(map((response: {board?: unknown; can_edit?: boolean}) => ({board: normalizeBoard(response?.board), canEdit: !!response?.can_edit})));
  }

  /** Saves the board made from `board.version`; answers with the new version. */
  set(projectId: string, board: Board): Observable<{version: number}> {
    return this.projects.projectsSetOverviewBoard({project: projectId, version: board.version, cards: board.cards});
  }
}
