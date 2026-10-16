import {Injectable} from '@angular/core';
import {TASK_TYPES} from '~/app.constants';
import {TAGS, TASKS_STATUS} from '@common/tasks/tasks.constants';
import {Task} from '../model/tasks/task';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';

@Injectable({providedIn: 'root'})
export class BlTasksService {
  canEnqueue(task: ISelectedExperiment): boolean {
    return !!(task && (TASKS_STATUS.CREATED === task.status || TASKS_STATUS.STOPPED === task.status) && task.type !== TASK_TYPES.MANUAL_ANNOTATION);
  }

  addHiddenTag(taskTags: Task['system_tags']): Task['system_tags'] {
    if (taskTags) {
      if (taskTags.includes('archived')) {
        return taskTags;
      } else {
        return taskTags.concat(['archived']);
      }
    } else {
      return ['archived'];
    }
  }

  removeHiddenTag(taskTags: Task['system_tags']): Task['system_tags'] {
    if (taskTags.includes('archived')) {
      return taskTags.filter(tag => tag !== 'archived');
    }
    return taskTags;
  }

  updateAnnotatorIndexTag(taskTags: Task['system_tags'], annotatorIndex: number): Task['system_tags'] {
    const indexOf = taskTags.findIndex(tag => tag.startsWith(TAGS.ANNOTATOR_INDEX_TAG_PREFIX));
    if (indexOf === -1) {
      taskTags.push(`${TAGS.ANNOTATOR_INDEX_TAG_PREFIX}:${annotatorIndex || '1'}`);
    } else {
      taskTags[indexOf] = `${TAGS.ANNOTATOR_INDEX_TAG_PREFIX}:${annotatorIndex}`;
    }
    return taskTags;
  }

  updateAnnotatedNumberTag(taskTags: Task['system_tags']): Task['system_tags'] {
    const indexOf = taskTags.findIndex(tag => tag.startsWith(TAGS.ANNOTATED_NUMBER_TAG_PREFIX));
    if (indexOf === -1) {
      taskTags.push(`${TAGS.ANNOTATED_NUMBER_TAG_PREFIX}:1`);
    } else {
      taskTags[indexOf] = `${TAGS.ANNOTATED_NUMBER_TAG_PREFIX}:${this.getTaskAnnotorValue(taskTags[indexOf]) + 1}`;
    }
    return taskTags;
  }

  getAnnotatorIndexTag(taskTags: Task['system_tags']): number {
    const foundTag = taskTags.find(tag => tag.startsWith(TAGS.ANNOTATOR_INDEX_TAG_PREFIX));
    return foundTag ? this.getTaskAnnotorValue(foundTag) : 0;
  }

  getAnnotatedNumberTag(taskTags: Task['system_tags']): number {
    const foundTag = taskTags.find(tag => tag.startsWith(TAGS.ANNOTATED_NUMBER_TAG_PREFIX));
    return foundTag ? this.getTaskAnnotorValue(foundTag) : 0;
  }

  getTaskAnnotorValue(annotatorTag: string): number {
    return parseInt(annotatorTag.split(':')[1], 10);
  }
}
