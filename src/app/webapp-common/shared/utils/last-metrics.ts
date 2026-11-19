import {get} from 'lodash-es';

/**
 * The value at a dynamic path of an experiment's last metrics, as lodash reads it (the fallback when the path is absent).
 *
 * The contract types last_metrics by metric and by variant. The compare views read a path that ends at the value they
 * show (a number, a text, or the metric's event), and the path is built at run time, so the type is given by the reader.
 * The caller checks the value as before.
 */
export function lastMetricValue<T>(lastMetrics: unknown, path: string, fallback?: T): T {
  return get(lastMetrics, path, fallback) as T;
}
