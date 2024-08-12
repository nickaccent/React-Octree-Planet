import Worker from '../WebWorkers/TerrainFaceWorker?worker';

class TaskQueue {
  constructor(workerCount) {
    this.workerPool = Array.from({ length: workerCount }, () => ({
      worker: new Worker(),
      active: false,
    }));
    this.taskQueue = [];
  }

  enqueueTask(task, onComplete) {
    this.taskQueue.push({ task, onComplete });
    this.processQueue();
  }

  processQueue() {
    if (this.taskQueue.length === 0) {
      return;
    }

    const availableWorker = this.workerPool.find((w) => !w.active);
    if (!availableWorker) {
      return; // No available worker, exit
    }

    const { task, onComplete } = this.taskQueue.shift();
    this.executeTask(availableWorker, task, onComplete);
  }

  executeTask(workerObj, task, onComplete) {
    workerObj.active = true;

    workerObj.worker.onmessage = (e) => {
      this.handleWorkerResponse(workerObj, e.data, onComplete);
    };
    workerObj.worker.onerror = (error) => {
      this.handleWorkerResponse(workerObj, { error: error.message }, onComplete);
    };

    workerObj.worker.postMessage(task);
  }

  handleWorkerResponse(workerObj, data, onComplete) {
    workerObj.active = false;
    this.processQueue(); // Continue processing remaining tasks

    if (onComplete) {
      onComplete(data); // Call the callback specific to the completed task
    } else {
      console.warn('No completion callback found for worker response');
    }
  }
}

export default TaskQueue;
