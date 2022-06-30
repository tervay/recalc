import adze, {
  createShed,
  LabelData,
  LogRender,
  LogTimestamp,
  MetaData,
  render,
} from "adze";
import { JSONable } from "common/models/ExtraTypes";
import PageConfig from "common/models/PageConfig";
import isEqual from "lodash/isEqual";
import lzstring from "lz-string";
import { wrapString } from "./util";

/**
 * Log levels:
 *    0 - alert
 *    1 - error
 *    2 - warn
 *    3 - info
 *    4 - fail
 *    5 - success
 *    6 - log
 *    7 - debug
 *    8 - verbose
 */

type LogEntry = {
  label: LabelData;
  namespace: string[] | null;
  args: unknown[] | null;
  timestamp: LogTimestamp | null;
  render: LogRender | null;
  alreadyRendered: boolean;
  meta: MetaData;
};

class LogCollector {
  private logs: LogEntry[];
  constructor() {
    this.logs = [];
  }

  private shouldLog(newLog: LogEntry): boolean {
    if (newLog.args === null) {
      console.log("null");
      return false;
    }

    for (let i = this.logs.length - 1; i >= 0; i--) {
      if (
        ![
          this.logs[i].args![0] === newLog.args[0],
          this.logs[i].label.name === newLog.label.name,
          isEqual(this.logs[i].namespace, newLog.namespace),
          isEqual(this.logs[i].meta, newLog.meta),
        ].includes(false)
      ) {
        return !isEqual(this.logs[i].args!.slice(1), newLog.args.slice(1));
      }
    }

    return true;
  }

  appendLog(log: LogEntry) {
    if (this.shouldLog(log)) {
      if (log.render !== null && !log.alreadyRendered) {
        render(log.render);
      }

      this.logs.push(log);
    }
  }

  compress(): string {
    return wrapString(
      [
        ...lzstring.compressToUint8Array(
          JSON.stringify(this.logs.map((log) => log.render?.[1]))
        ),
      ]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join(" "),
      60
    );
  }
}

const shed = createShed({ cacheLimit: 9999999 });
export const logCollector = new LogCollector();

shed.addListener("*", ({ args, label, namespace, meta }, render, printed) => {
  const collection = shed.getCollection("*");
  const lastLog = collection[collection.length - 1];

  logCollector.appendLog({
    args: lastLog.data.args,
    timestamp: lastLog.data.timestamp,
    render,
    alreadyRendered: printed,
    namespace,
    label,
    meta,
  });
});

const relog = adze({
  useEmoji: false,
  machineReadable: process.env.environment === "production",
  captureStacktrace: false,
  terminalColorFidelity: 3,
  logLevel: 20,
}).timestamp.silent.seal();

export default function useLogger(
  namespace: string,
  label: string
): () => ReturnType<typeof adze> {
  return () => relog().namespace(namespace).label(label);
}

export function useComponentLogger(
  pageConfig: PageConfig
): ReturnType<typeof useLogger> {
  return useLogger("", "");
}

export function useFileLogger(namespace: string): ReturnType<typeof useLogger> {
  return () => relog().namespace(namespace);
}

export function useFunctionLogger(
  fileLogger: ReturnType<typeof useLogger>,
  functionName: string,
  args: Record<string, JSONable>
): ReturnType<typeof useLogger> {
  return () => {
    let _log = fileLogger().namespace(functionName);

    Object.keys(args).forEach((k) => {
      _log = _log.meta(k, JSON.parse(JSON.stringify(args[k])));
    });

    return _log;
  };
}

type Debugger = (args: Record<string, JSONable>) => void;
export function useDebugger(logger: ReturnType<typeof useLogger>): Debugger {
  return (vars) => {
    Object.keys(vars).forEach((k) => {
      logger().debug(k, vars[k]);
    });
  };
}

export function debugAndReturn<T extends JSONable>(
  value: T,
  debugger_: Debugger
): T {
  debugger_({ return: value });
  return value;
}
