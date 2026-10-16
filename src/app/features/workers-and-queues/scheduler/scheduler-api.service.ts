import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {HTTP} from '~/app.constants';
import {map, Observable} from 'rxjs';

/** The scheduler endpoints are at API version 2.36; the generated services are older, so they are called here. */
const SCHEDULER_API_VERSION = 'v2.36';

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

export interface SchedulerJobUsage {
  ram_gb?: number;
  peak_ram_gb?: number;
  cpu_seconds?: number;
}

export interface SchedulerJobOnWorker {
  task: string;
  name?: string;
  state: string;
  cpus: number[];
  gpus: number[];
  ram_gb: number;
  disk_gb: number;
  exclusive: boolean;
  usage: SchedulerJobUsage;
}

export interface SchedulerWorker {
  id: string;
  state: string;
  capacity: SchedulerCapacity;
  reserved: { cpus: number; ram_gb: number; disk_gb: number };
  usage: SchedulerWorkerUsage;
  exclusive_task: string | null;
  last_sync: string | null;
  jobs: SchedulerJobOnWorker[];
}

export interface SchedulerJob {
  task: string;
  name: string;
  state: 'running' | 'pending';
  worker?: string;
  priority: number;
  exclusive?: boolean;
  cpus?: number[];
  gpus?: number[];
  ram_gb?: number;
  disk_gb?: number;
  requirements?: { cpus: number; ram_gb: number; gpus: { count: number; min_memory_gb: number; model: string | null }; disk_gb: number; max_runtime_min?: number } | null;
  reason?: string;
  since?: string;
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
  ram_gb?: number;
  peak_ram_gb?: number;
}

@Injectable({providedIn: 'root'})
export class SchedulerApiService {
  private http = inject(HttpClient);

  private url(endpoint: string): string {
    return `${HTTP.API_BASE_URL_NO_VERSION}/${SCHEDULER_API_VERSION}/${endpoint}`;
  }

  overview(): Observable<SchedulerWorker[]> {
    return this.http.post<{ data: { workers: SchedulerWorker[] } }>(this.url('scheduler.get_overview'), {}, {withCredentials: true})
      .pipe(map(res => res.data.workers));
  }

  jobs(): Observable<SchedulerJob[]> {
    return this.http.post<{ data: { jobs: SchedulerJob[] } }>(this.url('scheduler.get_jobs'), {}, {withCredentials: true})
      .pipe(map(res => res.data.jobs));
  }

  events(limit = 50): Observable<SchedulerEvent[]> {
    return this.http.post<{ data: { events: SchedulerEvent[] } }>(this.url('scheduler.get_events'), {limit}, {withCredentials: true})
      .pipe(map(res => res.data.events));
  }

  /** Enqueue one task with its requirements and priority (version 2.36 of tasks.enqueue). */
  enqueue(task: string, requirements: Record<string, unknown> | null, priority: number | null): Observable<unknown> {
    const body: Record<string, unknown> = {task, requirements: requirements ?? {}};
    if (priority !== null && priority !== undefined) {
      body.priority = priority;
    }
    return this.http.post(this.url('tasks.enqueue'), body, {withCredentials: true});
  }

  usageHistory(minutes: number): Observable<SchedulerUsagePoint[]> {
    return this.http.post<{ data: { points: SchedulerUsagePoint[] } }>(this.url('scheduler.get_usage_history'), {minutes}, {withCredentials: true})
      .pipe(map(res => res.data.points));
  }
}
