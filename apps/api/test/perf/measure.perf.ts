import '../../scripts/perf/perf-query-flag';
import { runMeasurement } from '../../scripts/perf/perf-measure';

describe('perf measure', () => {
  it('records latency, queries and response size', async () => {
    await runMeasurement();
  }, 1_800_000);
});
