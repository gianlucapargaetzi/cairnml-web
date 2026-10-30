import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {IFooterState, ItemFooterModel} from './footer-items.models';
import {MenuItems} from '../items.utils';
import {entityDisplayName} from '~/shared/constants/non-common-consts';

export class ShowItemsFooterSelected extends ItemFooterModel {

  constructor(public entitiesType: EntityTypeEnum) {
    super();
    this.id = MenuItems.showAllItems;
    this.emit = true;
    this.class = 'show-all';

  }

  getItemState(state: IFooterState<{id: string}>) {
    return {
      title: state.showAllSelectedIsActive ?
        `Show all ${entityDisplayName(this.entitiesType).toLowerCase()}s` :
        `Show ${state.selected.length} ${entityDisplayName(this.entitiesType).toLowerCase()}s selected`,
      emitValue: state.showAllSelectedIsActive,
      preventCurrentItem: false
    };
  }
}
