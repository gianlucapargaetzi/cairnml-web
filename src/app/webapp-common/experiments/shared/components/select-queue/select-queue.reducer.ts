import {createFeature, createReducer, on} from '@ngrx/store';
import {setTaskForEnqueue} from './select-queue.actions';
import {Task} from '~/business-logic/model/tasks/task';

interface SelectQueueState {
  tasks: Task[];
}

const selectQueueInitState: SelectQueueState = {
  tasks: null
};


export const selectQueueFeature = createFeature({
  name: 'selectQueue',
  reducer: createReducer(
    selectQueueInitState,
    on(setTaskForEnqueue, (state, action): SelectQueueState => ({...state, tasks: action.tasks})),
  )
});
