import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';

export type TaskTableColFieldsEnum = 'output.result' | 'comment' | 'id' | 'project.name' | 'name' | 'type' | 'status' | 'started' | 'last_update' | 'user.name';
export const CARDS_IN_ROW                  = 6;
export const RECENT_TASKS_TABLE_COL_FIELDS = {
  RESULT     : 'output.result' as TaskTableColFieldsEnum,
  COMMENT    : 'comment' as TaskTableColFieldsEnum,
  ID         : 'id' as TaskTableColFieldsEnum,
  PROJECT    : 'project.name' as TaskTableColFieldsEnum,
  NAME       : 'name' as TaskTableColFieldsEnum,
  TYPE       : 'type' as TaskTableColFieldsEnum,
  STATUS     : 'status' as TaskTableColFieldsEnum,
  STARTED    : 'started' as TaskTableColFieldsEnum,
  LAST_UPDATE: 'last_update' as TaskTableColFieldsEnum,
  USER       : 'user.name' as TaskTableColFieldsEnum,
};

export const RECENT_EXPERIMENTS_TABLE_COLS: ISmCol[] = [
  {
    id            : RECENT_TASKS_TABLE_COL_FIELDS.ID,
    headerType    : ColHeaderTypeEnum.title,
    header        : 'Task ID',
    collapseOrder : 4,
    disableDrag   : true,
    disablePointerEvents: true
  },
  {
    id            : RECENT_TASKS_TABLE_COL_FIELDS.TYPE,
    headerType    : ColHeaderTypeEnum.title,
    header        : 'Type',
    collapseOrder : 3,
    bodyStyleClass: 'type-col',
    disableDrag   : true,
    disablePointerEvents: true
  },
  {
    id         : RECENT_TASKS_TABLE_COL_FIELDS.NAME,
    headerType : ColHeaderTypeEnum.title,
    header     : 'Title',
    collapseOrder : 9,
    disableDrag: true,
    disablePointerEvents: true

  },
  {
    id         : RECENT_TASKS_TABLE_COL_FIELDS.PROJECT,
    headerType : ColHeaderTypeEnum.title,
    header     : 'Project',
    collapseOrder : 5,
    disableDrag: true,
    disablePointerEvents: true

  },
  {
    id         : RECENT_TASKS_TABLE_COL_FIELDS.STARTED,
    headerType : ColHeaderTypeEnum.title,
    header     : 'Started',
    collapseOrder : 1,
    disableDrag: true,
    disablePointerEvents: true

  },
  {
    id         : RECENT_TASKS_TABLE_COL_FIELDS.LAST_UPDATE,
    headerType : ColHeaderTypeEnum.title,
    header     : 'Updated',
    collapseOrder : 2,
    disableDrag: true,
    disablePointerEvents: true

  },
  {
    id            : RECENT_TASKS_TABLE_COL_FIELDS.STATUS,
    headerType    : ColHeaderTypeEnum.title,
    header        : 'Status',
    collapseOrder : 7,
    bodyStyleClass: 'status-col',
    disableDrag   : true,
    disablePointerEvents: true

  }
];
export const DASHBOARD_PREFIX = 'DASHBOARD_';
