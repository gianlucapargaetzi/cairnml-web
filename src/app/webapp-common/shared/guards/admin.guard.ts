import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {map, take} from 'rxjs/operators';
import {selectIsAdmin} from '@common/core/reducers/users-reducer';

export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(selectIsAdmin).pipe(
    take(1),
    map(isAdmin => isAdmin || router.parseUrl('/settings/profile'))
  );
};
