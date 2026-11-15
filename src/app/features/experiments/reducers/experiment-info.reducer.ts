import {CommonExperimentInfoState} from '@common/experiments/reducers/common-experiment-info.reducer';
export {
  commonExperimentInfoReducer as experimentInfoReducer,
  initialCommonExperimentInfoState as initialState,
} from '@common/experiments/reducers/common-experiment-info.reducer';

export interface ExperimentInfoState extends CommonExperimentInfoState {
  errors: Record<string, any> | null;
}
