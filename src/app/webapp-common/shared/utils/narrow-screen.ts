import {inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';

/** True below 960px: split views stack their detail panel under the list (see docs/design-system/03-layout-system.md). */
export const injectNarrowScreen = () => toSignal(
  inject(BreakpointObserver).observe('(max-width: 959px)').pipe(map(state => state.matches)),
  {initialValue: false}
);
