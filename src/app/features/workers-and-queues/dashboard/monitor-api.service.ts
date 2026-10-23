import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {HTTP} from '~/app.constants';
import {map, Observable, of} from 'rxjs';

/** The monitor reads the usage history, which the workers' status reports fill (scheduler endpoints, version 2.36). */
const MONITOR_API_VERSION = 'v2.36';

export interface SchedulerGpu {
  index: number;
  model: string;
  memory_gb: number;
}

export interface SchedulerCapacity {
  cpus: number;
  ram_gb: number;
  disk_gb: number;
  gpus: SchedulerGpu[];
}

export interface SchedulerWorkerUsage {
  cpu_percent?: number;
  ram_used_gb?: number;
  disk_used_percent?: number;
}

export interface SchedulerWorker {
  id: string;
  state: string;
  capacity: SchedulerCapacity;
  reserved: { cpus: number; ram_gb: number; disk_gb: number };
  usage: SchedulerWorkerUsage;
  exclusive_task: string | null;
  last_sync: string | null;
  jobs: unknown[];
}

export interface SchedulerEvent {
  time: string;
  kind: string;
  task: string | null;
  worker: string | null;
  detail: string;
}

export interface SchedulerUsagePoint {
  timestamp: number;
  worker: string;
  task: string;
  kind: 'machine' | 'job';
  cpu_percent?: number;
  ram_used_gb?: number;
  disk_used_percent?: number;
  cpus?: number;
  ram_gb?: number;
  disk_gb?: number;
  peak_ram_gb?: number;
}

/** How far back the monitor looks for a worker's latest machine sample, in minutes. */
const OVERVIEW_MINUTES = 5;

@Injectable({providedIn: 'root'})
export class MonitorApiService {
  private http = inject(HttpClient);

  private url(endpoint: string): string {
    return `${HTTP.API_BASE_URL_NO_VERSION}/${MONITOR_API_VERSION}/${endpoint}`;
  }

  /** The workers that reported recently, each with its latest machine sample and what the machine has in total. */
  overview(): Observable<SchedulerWorker[]> {
    return this.usageHistory(OVERVIEW_MINUTES).pipe(
      map(points => {
        const latest = new Map<string, SchedulerUsagePoint>();
        for (const point of points.filter(p => p.kind === 'machine')) {
          latest.set(point.worker, point);
        }
        return [...latest.values()].map(point => ({
          id: point.worker,
          state: 'active',
          capacity: {cpus: point.cpus ?? 0, ram_gb: point.ram_gb ?? 0, disk_gb: point.disk_gb ?? 0, gpus: []},
          reserved: {cpus: 0, ram_gb: 0, disk_gb: 0},
          usage: {cpu_percent: point.cpu_percent, ram_used_gb: point.ram_used_gb, disk_used_percent: point.disk_used_percent},
          exclusive_task: null,
          last_sync: new Date(point.timestamp).toISOString(),
          jobs: [],
        }));
      }),
    );
  }

  /** Events of the scheduler are gone with the scheduler: nothing to show. */
  events(_limit = 50): Observable<SchedulerEvent[]> {
    return of([]);
  }

  usageHistory(minutes: number): Observable<SchedulerUsagePoint[]> {
    return this.http.post<{ data: { points: SchedulerUsagePoint[] } }>(this.url('scheduler.get_usage_history'), {minutes}, {withCredentials: true})
      .pipe(map(res => res.data.points));
  }
}
