// Runs the Regex Tester's matching in a Web Worker, so a runaway pattern can be stopped instead of freezing the page.
// Every job gets its own timeout. A job that's still running when the next one starts, when the pattern stops being
// valid or when the tester goes away is stopped by terminating its worker; a worker that finished its job is reused.

export interface Hit {
  full: string;
  index: number;
  subs: (string | null)[];
  groups: Record<string, string | null> | null;
}
export interface LineResult {
  first: Hit | null;
  all: Hit[];
  /** There were more than MAX_MATCHES matches; `all` has the first MAX_MATCHES. */
  more: boolean;
}
export interface MatchJob {
  source: string;
  flags: string;
  texts: string[];
  /** Also list every match (MatchAll), not only the first. */
  all: boolean;
}
export interface MatchReply {
  id: number;
  lines: LineResult[];
}
export type MatchResult = MatchReply | { id: number; timeout: true };

export const TIMEOUT = 1500;
export const MAX_MATCHES = 500;

/** The worker's source, run from a Blob URL. It answers each job with a MatchReply. */
export const MATCH_WORKER = `onmessage = (e) => {
  const { id, source, flags, texts, all } = e.data;
  const re = new RegExp(source, flags), reG = new RegExp(source, flags + 'g');
  const hit = (m) => m && { full: m[0], index: m.index, subs: m.slice(1).map((s) => s ?? null), groups: m.groups ? Object.fromEntries(Object.entries(m.groups).map(([k, v]) => [k, v ?? null])) : null };
  // Stop at the cap rather than collecting every match first; finding one more means the list was cut.
  const every = (t) => {
    const out = [];
    for (const m of t.matchAll(reG)) {
      if (out.length === ${MAX_MATCHES}) return { all: out, more: true };
      out.push(hit(m));
    }
    return { all: out, more: false };
  };
  postMessage({ id, lines: texts.map((t) => ({ first: hit(re.exec(t)), ...(all ? every(t) : { all: [], more: false }) })) });
};`;

export interface MatchWorker {
  postMessage(job: MatchJob & { id: number }): void;
  terminate(): void;
}

export interface Timers {
  set: (run: () => void, ms: number) => unknown;
  clear: (timer: unknown) => void;
}

const realTimers: Timers = {
  set: (run, ms) => setTimeout(run, ms),
  clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export interface MatchRunnerOptions {
  /** Starts a worker running MATCH_WORKER that hands every reply to `onReply`. */
  createWorker: (onReply: (reply: MatchReply) => void) => MatchWorker;
  /** Gets the lines of a finished job, or a timeout for one that ran too long. */
  onResult: (result: MatchResult) => void;
  timeout?: number;
  timers?: Timers;
}

export interface MatchRunner {
  /** Starts a job and returns its id. A job that's still running is stopped first. */
  run(job: MatchJob): number;
  /** Stops the running job, if any. An idle worker is kept for the next job. */
  cancel(): void;
  /** Stops everything. A later run() starts a new worker. */
  dispose(): void;
}

export function createMatchRunner({
  createWorker,
  onResult,
  timeout = TIMEOUT,
  timers = realTimers,
}: MatchRunnerOptions): MatchRunner {
  let worker: MatchWorker | null = null;
  let running = 0; // id of the job the worker is busy with; 0 when it's idle
  let timer: unknown;
  let last = 0;

  const stop = () => {
    worker?.terminate();
    worker = null;
    running = 0;
    timers.clear(timer);
  };
  const cancel = () => {
    // Terminating is the only way to stop a job that's stuck in a regex. Queuing the next job behind it would
    // make that one time out too, and the stuck one would keep a CPU core busy.
    if (running) stop();
  };
  const reply = (r: MatchReply) => {
    if (r.id !== running) return;
    running = 0;
    timers.clear(timer);
    onResult(r);
  };

  return {
    run(job) {
      cancel();
      const id = ++last;
      worker ??= createWorker(reply);
      worker.postMessage({ id, ...job });
      running = id;
      timer = timers.set(() => {
        if (running !== id) return;
        stop();
        onResult({ id, timeout: true });
      }, timeout);
      return id;
    },
    cancel,
    dispose: stop,
  };
}
