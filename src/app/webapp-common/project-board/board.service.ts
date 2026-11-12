import {inject, Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {Board} from './board.model';
import {normalizeBoard} from './board-layout';

/** The overview board of a project on the server (`projects.get_overview_board` and `projects.set_overview_board`). */
@Injectable({providedIn: 'root'})
export class BoardService {
  private readonly api = inject(SmApiRequestsService);

  /** The saved board, or null when the project never saved one (or what is stored cannot be shown). */
  get(projectId: string): Observable<Board | null> {
    return this.api.post<{board?: unknown}>(`${HTTP.API_BASE_URL}/projects.get_overview_board`, {project: projectId}, {})
      .pipe(map(response => normalizeBoard(response?.board)));
  }

  /** Saves the board made from `board.version`; answers with the new version. */
  set(projectId: string, board: Board): Observable<{version: number}> {
    return this.api.post<{version: number}>(`${HTTP.API_BASE_URL}/projects.set_overview_board`,
      {project: projectId, version: board.version, cards: board.cards}, {});
  }
}
