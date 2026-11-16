import { describe, expect, it, vi } from 'vitest';
import {
  MATCH_WORKER,
  MAX_MATCHES,
  createMatchRunner,
  TIMEOUT,
  type LineResult,
  type MatchJob,
  type MatchReply,
  type MatchResult,
} from './regexRunner';

/** A stand-in for the Web Worker: it keeps the jobs it was sent and replies only when told to. */
class FakeWorker {
  jobs: (MatchJob & { id: number })[] = [];
  terminated = false;
  onReply: (reply: MatchReply) => void;
  constructor(onReply: (reply: MatchReply) => void) {
    this.onReply = onReply;
  }
  postMessage(job: MatchJob & { id: number }) {
    this.jobs.push(job);
  }
  terminate() {
    this.terminated = true;
  }
  /** Finishes the last job it was sent. */
  finish() {
    this.onReply({ id: this.jobs[this.jobs.length - 1].id, lines: [] });
  }
}

/** Timers that only fire when the test says time has passed. */
class FakeTimers {
  private pending = new Map<number, { run: () => void; ms: number }>();
  private next = 0;
  set = (run: () => void, ms: number) => {
    this.pending.set(++this.next, { run, ms });
    return this.next;
  };
  clear = (timer: unknown) => {
    this.pending.delete(timer as number);
  };
  get count() {
    return this.pending.size;
  }
  /** Fires every timer that's due `ms` after it was set. */
  elapse(ms: number) {
    for (const [k, t] of [...this.pending]) {
      if (t.ms > ms) continue;
      this.pending.delete(k);
      t.run();
    }
  }
}

function setup() {
  const workers: FakeWorker[] = [];
  const results: MatchResult[] = [];
  const timers = new FakeTimers();
  const runner = createMatchRunner({
    createWorker: (onReply) => {
      const w = new FakeWorker(onReply);
      workers.push(w);
      return w;
    },
    onResult: (r) => results.push(r),
    timers,
  });
  return { runner, workers, results, timers };
}

const job = (source: string): MatchJob => ({ source, flags: 'u', texts: ['abc'], all: false });

describe('match runner', () => {
  it('reuses the worker for jobs that finished before the next one starts', () => {
    const { runner, workers, results, timers } = setup();
    const a = runner.run(job('a'));
    workers[0].finish();
    const b = runner.run(job('b'));
    workers[0].finish();
    expect(workers).toHaveLength(1);
    expect(workers[0].terminated).toBe(false);
    expect(workers[0].jobs.map((j) => j.source)).toEqual(['a', 'b']);
    expect(results).toEqual([
      { id: a, lines: [] },
      { id: b, lines: [] },
    ]);
    expect(timers.count).toBe(0);
  });

  it('stops a hung job when the pattern is edited, and runs the edit in a fresh worker with its own timeout', () => {
    const { runner, workers, results, timers } = setup();
    runner.run(job('(a+)+$'));
    const b = runner.run(job('a+$'));
    expect(workers).toHaveLength(2);
    expect(workers[0].terminated).toBe(true);
    expect(workers[1].jobs.map((j) => j.source)).toEqual(['a+$']);
    // Only the edited pattern's timer is left, and it starts from zero.
    expect(timers.count).toBe(1);
    workers[1].finish();
    timers.elapse(TIMEOUT);
    expect(results).toEqual([{ id: b, lines: [] }]);
  });

  it('times out an edited pattern that hangs too, without reporting the first one', () => {
    const { runner, workers, results, timers } = setup();
    runner.run(job('(a+)+$'));
    const b = runner.run(job('(b+)+$'));
    timers.elapse(TIMEOUT);
    expect(results).toEqual([{ id: b, timeout: true }]);
    expect(workers.map((w) => w.terminated)).toEqual([true, true]);
  });

  it('ignores a reply from a job that was stopped', () => {
    const { runner, workers, results } = setup();
    runner.run(job('a'));
    runner.run(job('b'));
    workers[0].finish();
    expect(results).toEqual([]);
  });

  it('stops a hung job when the pattern becomes invalid', () => {
    const { runner, workers, results, timers } = setup();
    runner.run(job('(a+)+$'));
    runner.cancel();
    expect(workers[0].terminated).toBe(true);
    expect(timers.count).toBe(0);
    workers[0].finish();
    expect(results).toEqual([]);
    // The next valid pattern gets a new worker.
    runner.run(job('a'));
    expect(workers).toHaveLength(2);
  });

  it('keeps an idle worker when the pattern becomes invalid', () => {
    const { runner, workers } = setup();
    runner.run(job('a'));
    workers[0].finish();
    runner.cancel();
    runner.run(job('b'));
    expect(workers).toHaveLength(1);
    expect(workers[0].terminated).toBe(false);
  });

  it('stops a hung job when the tester goes away', () => {
    const { runner, workers, results, timers } = setup();
    runner.run(job('(a+)+$'));
    runner.dispose();
    expect(workers[0].terminated).toBe(true);
    expect(timers.count).toBe(0);
    workers[0].finish();
    expect(results).toEqual([]);
  });

  it('terminates an idle worker when the tester goes away', () => {
    const { runner, workers } = setup();
    runner.run(job('a'));
    workers[0].finish();
    runner.dispose();
    expect(workers[0].terminated).toBe(true);
  });

  it('reports a timeout, then runs the next job in a fresh worker', () => {
    const { runner, workers, results, timers } = setup();
    const a = runner.run(job('(a+)+$'));
    timers.elapse(TIMEOUT - 1);
    expect(results).toEqual([]);
    timers.elapse(TIMEOUT);
    expect(results).toEqual([{ id: a, timeout: true }]);
    expect(workers[0].terminated).toBe(true);
    const b = runner.run(job('a'));
    workers[1].finish();
    expect(results).toEqual([
      { id: a, timeout: true },
      { id: b, lines: [] },
    ]);
  });
});

/** Runs the worker's source in this thread and returns its reply. */
function work(job: MatchJob): MatchReply {
  let reply: MatchReply | undefined;
  const handler = new Function(
    'postMessage',
    `let onmessage;
${MATCH_WORKER}
return onmessage;`,
  )((r: MatchReply) => (reply = r));
  handler({ data: { id: 1, ...job } });
  return reply!;
}

describe('match worker', () => {
  it('lists every match when there are no more than the cap', () => {
    const [line] = work({ source: 'a', flags: 'u', texts: ['a'.repeat(MAX_MATCHES)], all: true }).lines;
    expect(line.all).toHaveLength(MAX_MATCHES);
    expect(line.more).toBe(false);
    expect(line.first).toEqual({ full: 'a', index: 0, subs: [], groups: null });
  });

  it('stops looking at the cap, and says there were more', () => {
    const exec = vi.spyOn(RegExp.prototype, 'exec');
    let line: LineResult, searches: number;
    try {
      [line] = work({ source: 'a', flags: 'u', texts: ['a'.repeat(20 * MAX_MATCHES)], all: true }).lines;
      searches = exec.mock.calls.length;
    } finally {
      exec.mockRestore();
    }
    expect(line.all).toHaveLength(MAX_MATCHES);
    expect(line.all[MAX_MATCHES - 1].index).toBe(MAX_MATCHES - 1);
    expect(line.more).toBe(true);
    // One search for Match, then MatchAll's searches up to one past the cap: not all 10,000.
    expect(searches).toBe(1 + MAX_MATCHES + 1);
  });

  it('lists no matches when only the first one is needed', () => {
    const [line] = work({ source: 'a', flags: 'u', texts: ['aaa'], all: false }).lines;
    expect(line).toEqual({ first: { full: 'a', index: 0, subs: [], groups: null }, all: [], more: false });
  });
});
