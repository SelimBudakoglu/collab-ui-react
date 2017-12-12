import './task-list-item.scss';
import { ITask } from '../user-task-manager.component';
import { UserTaskManagerService } from '../user-task-manager.service';

class TaskListItemController implements ng.IComponentController {
  public task: ITask;

  /* @ngInject */
  constructor(
    private UserTaskManagerService: UserTaskManagerService,
  ) {}

  public isTaskInProcess() {
    if (!_.isUndefined(this.task)) {
      return this.UserTaskManagerService.isTaskInProcess(this.task.status);
    } else {
      return false;
    }
  }

  public isTaskError() {
    if (!_.isUndefined(this.task)) {
      return this.UserTaskManagerService.isTaskError(this.task.status);
    } else {
      return false;
    }
  }

  public isTaskCanceled() {
    if (!_.isUndefined(this.task)) {
      return this.UserTaskManagerService.isTaskCanceled(this.task.status);
    } else {
      return false;
    }
  }
}

export class TaskListItemComponent implements ng.IComponentOptions {
  public controller = TaskListItemController;
  public template = require('./task-list-item.html');
  public bindings = {
    task: '<',
    isActiveTask: '<',
  };
}