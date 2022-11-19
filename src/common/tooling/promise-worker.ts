/**
 *  promise-worker.ts v1.0
 *
 *  Make using web workers as easy as calling functions!
 *
 *  For usage & details see README:
 *  https://gist.github.com/RedstoneWizard22/d07b326a438dd0449758c263cebd0e82
 *
 */

//////// Types ////////

/** An object containing the exposed functions (see `expose`) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExposedFunctions = Record<string, (...args: any[]) => any>;

/** Message sent to the worker */
type request = {
  /** job id */
  id: number;
  /** Function to execute */
  action: string;
  /** Arguments to pass to function */
  payload: unknown[];
};

/** Message received from the worker */
type response = {
  /** job id */
  id: number;
  /** :] */
  type: "success" | "error";
  /** e.g. the execution result / caught error */
  payload: unknown;
};

/** The wrapper used to interface with the worker. It has an async wrapper function for
 *  every exposed function, and a `terminate` function to kill the worker
 */
type PromiseWorker<T extends ExposedFunctions> = {
  // Make all functions in T return promises
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Result
    ? (
        ...args: Args
      ) => Result extends Promise<unknown> ? Result : Promise<Result>
    : never;
} & { terminate: () => void };

//////// Functions ////////

/**
 * Expose a set of functions to be callable from the master thread via a PromiseWorker wrapper
 * (see `wrap`)
 * @param [functions] An object whose entries are the functions to be exposed
 */
function expose(functions: ExposedFunctions): void {
  // Ensure we are running in a worker
  if (typeof WorkerGlobalScope === "undefined") {
    console.error("Expose not called in worker thread");
    return;
  }

  const onSuccess = function (request: request, result: unknown) {
    postMessage({
      id: request.id,
      type: "success",
      payload: result,
    } as response);
  };

  const onError = function (request: request, error: unknown) {
    postMessage({ id: request.id, type: "error", payload: error } as response);
  };

  /** Returns a list of names of all exposed functions */
  const getFunctionality = function () {
    const functionality = Object.keys(functions).filter(
      (key) => typeof functions[key] === "function"
    );
    return functionality;
  };

  /** Executes the function corresponding to a request and returns a promise of the result */
  const exec = function (request: request): Promise<unknown> {
    const func = functions[request.action];
    const args = request.payload;

    const result = func(...args) as unknown;

    if (result instanceof Promise) {
      return result;
    }

    return Promise.resolve(result);
  };

  onmessage = async function (message: MessageEvent<request>) {
    const request = message.data;
    // We must catch any errors so we can match them to a request
    try {
      let result: unknown;
      if (request.action === "getFunctionality") {
        result = getFunctionality();
      } else {
        result = await exec(request);
      }
      onSuccess(request, result);
    } catch (e) {
      onError(request, e);
    }
  };
}

/** Takes in an exposed worker, returns the PromiseWorker wrapper used to interact with it
 *  (see README for details)
 */
async function wrap<T extends ExposedFunctions>(
  worker: Worker
): Promise<PromiseWorker<T>> {
  type job = {
    request: request;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  };

  let jobId = 0;
  const activeJobs: job[] = [];

  /** Creates and runs a new job, returns a promise for it's result */
  const createJob = function (temp: Pick<request, "action" | "payload">) {
    const request = { ...temp, id: jobId++ };
    const jobResult = new Promise((resolve, reject) => {
      activeJobs.push({ request, resolve, reject });
    });
    worker.postMessage(request);

    return jobResult;
  };

  worker.onmessage = function (message: MessageEvent<response>) {
    const response = message.data;

    const jobIndex = activeJobs.findIndex(
      (job) => job.request.id == response.id
    );

    if (jobIndex < 0) {
      console.error("Worker responded to nonexistent job");
      console.warn("Worker's response:", response);
      return;
    } else {
      const job = activeJobs.splice(jobIndex, 1)[0];
      response.type == "success"
        ? job.resolve(response.payload)
        : job.reject(response.payload);
    }
  };

  worker.onerror = function (error) {
    // We don't actually know what job the error occured in, so reject them all just to be safe.
    // This event should never fire since we have a try catch within the worker's onmessage
    console.error("Uncaught error in worker:", error);

    const jobs = activeJobs.splice(0, activeJobs.length);
    jobs.forEach((job) => job.reject(error));
  };

  /// Create the wrapper
  // Obtain a list of functions available in the worker
  const functionality = (await createJob({
    action: "getFunctionality",
    payload: [],
  })) as string[];

  // Create proxy functions for these
  const wrapper = {} as ExposedFunctions;
  functionality.forEach(
    (item) =>
      (wrapper[item] = (...args: unknown[]) =>
        createJob({ action: item, payload: args }))
  );

  // Add the termination function
  wrapper.terminate = () => worker.terminate();

  return wrapper as PromiseWorker<T>;
}

//////// Exports ////////

export { expose, wrap };
