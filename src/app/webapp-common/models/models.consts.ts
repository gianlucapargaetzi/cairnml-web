import {ColHeaderFilterTypeEnum, ColHeaderTypeEnum, ISmCol} from '../shared/ui-components/data/table/table.consts';
import {MODELS_TABLE_COL_FIELDS} from './shared/models.const';
import {rootProjectsPageSize} from '@common/constants';
import {Link} from '~/features/experiments/experiments.consts';

export type ModelWizardMethodsEnum = 'create' | 'edit' | 'clone' | 'extend';
export const WIZARD_METHODS = {
  CREATE: 'create' as ModelWizardMethodsEnum,
  CLONE : 'clone' as ModelWizardMethodsEnum,
  EDIT  : 'edit' as ModelWizardMethodsEnum,
  EXTEND: 'extend' as ModelWizardMethodsEnum,
};

export type ModelsViewModesEnum = 'table' | 'tree';
export const MODELS_VIEW_MODES = {
  TABLE: 'table' as ModelsViewModesEnum,
  TREE : 'tree' as ModelsViewModesEnum,
};

export const MODELS_PAGE_SIZE = 30;
export const MODELS_STORE_KEY = 'models';

export const MODELS_PREFIX_INFO = 'MODELS_INFO_';
export const MODELS_PREFIX_MENU = 'MODELS_MENU_';
export const MODELS_PREFIX_VIEW = 'MODELS_';


export const STATUS = {
  PUBLISHED: 'Published',
  DRAFT    : 'Draft'
};

export const MODELS_TABLE_COLS: ISmCol[] = [
  {
    id              : MODELS_TABLE_COL_FIELDS.SELECTED,
    headerType      : ColHeaderTypeEnum.checkBox,
    sortable        : false,
    filterable      : false,
    hidden          : false,
    header          : '',
    headerStyleClass: 'selected-col-header',
    style           : {width: '70px', maxWidth: '70px'},
    disableDrag     : true,
  },
  {
    id            : MODELS_TABLE_COL_FIELDS.ID,
    headerType    : ColHeaderTypeEnum.title,
    header        : 'ID',
    style         : {width: '100px'},
  },
  {
    id          : MODELS_TABLE_COL_FIELDS.FRAMEWORK,
    headerType  : ColHeaderTypeEnum.sortFilter,
    sortable    : true,
    filterable  : true,
    searchableFilter: true,
    header      : 'Framework',
    style       : {width: '100px'},
    showInCardFilters: true
  },
  {
    id          : MODELS_TABLE_COL_FIELDS.NAME,
    headerType  : ColHeaderTypeEnum.sortFilter,
    sortable    : true,
    header      : 'Name',
    style       : {width: '300px'},
  },
  {
    id          : MODELS_TABLE_COL_FIELDS.TAGS,
    headerType  : ColHeaderTypeEnum.sortFilter,
    getter: ['tags', 'system_tags'],
    filterable  : true,
    sortable    : false,
    searchableFilter: true,
    header      : 'Tags',
    style       : {width: '240px'},
    excludeFilter: true,
    andFilter: true,
    columnExplain: 'Click to include tag. Click again to exclude.',
    showInCardFilters: true
  },
  {
    id          : MODELS_TABLE_COL_FIELDS.READY,
    headerType  : ColHeaderTypeEnum.sortFilter,
    sortable    : true,
    filterable  : true,
    header      : 'Status',
    style       : {width: '135px'},
    showInCardFilters: true
  },
  {
    id          : MODELS_TABLE_COL_FIELDS.PROJECT,
    headerType  : ColHeaderTypeEnum.sortFilter,
    filterable  :  true,
    searchableFilter: true,
    sortable    : false,
    asyncFilter : true,
    paginatedFilterPageSize : rootProjectsPageSize,
    header      : 'Project',
    style       : {width: '135px'}
  },
  {
    id              : MODELS_TABLE_COL_FIELDS.USER,
    getter          : 'user.name',
    headerType      : ColHeaderTypeEnum.sortFilter,
    searchableFilter: true,
    filterable      : true,
    sortable        : false,
    header          : 'User',
    style           : {width: '240px'},
    showInCardFilters: true
  },
  {
    id        : MODELS_TABLE_COL_FIELDS.TASK,
    headerType: ColHeaderTypeEnum.title,
    sortable  : false,
    header    : 'Task',
    style     : {width: '240px'}
  },
  {
    id        : MODELS_TABLE_COL_FIELDS.LAST_UPDATE,
    headerType  : ColHeaderTypeEnum.sortFilter,
    sortable  : true,
    filterType    : ColHeaderFilterTypeEnum.durationDate,
    filterable: true,
    searchableFilter: false,
    header      : 'Updated',
    label       : 'Updated',
    style       : {width: '150px'},
  },
  {
    id        : MODELS_TABLE_COL_FIELDS.COMMENT,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable  : true,
    header    : 'Description',
    style     : {width: '240px'}
  },
];

export const  infoModelsTabsLinks = [
  {name: 'General', url: ['general']},
  {name: 'Network', url: ['network']},
  {name: 'Labels', url: ['labels']},
  {name: 'Metadata', url: ['metadata']},
  {name: 'Lineage', url: ['tasks']},
  {name: 'Scalars', url: ['scalars']},
  {name: 'Plots', url: ['plots']},
] as Link[];
