// Sample data until the server has an endpoint for resource groups. Figures are examples.
export interface ResourceUsage {
  used: number;
  total: number;
}

export interface ResourceGroup {
  name: string;
  workers: ResourceUsage;
  gpus: ResourceUsage;
  cpus: ResourceUsage;
  cpuLoad: number;
  ramFreeGb: number;
  freeDiskPercent: number;
  networkTx: number;
  networkRx: number;
  alert?: string;
}

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    name: 'Cloud_H100:AWS-p5.48xlarge',
    workers: {used: 10, total: 20},
    gpus: {used: 80, total: 160},
    cpus: {used: 1920, total: 3840},
    cpuLoad: 73,
    ramFreeGb: 482,
    freeDiskPercent: 20,
    networkTx: 0.2,
    networkRx: 98,
  },
  {
    name: 'DGX_H100',
    workers: {used: 8, total: 8},
    gpus: {used: 64, total: 64},
    cpus: {used: 112, total: 112},
    cpuLoad: 86,
    ramFreeGb: 88,
    freeDiskPercent: 132,
    networkTx: 85,
    networkRx: 99,
  },
  {
    name: 'On_Prem_L40S',
    workers: {used: 8, total: 16},
    gpus: {used: 8, total: 16},
    cpus: {used: 64, total: 128},
    cpuLoad: 99,
    ramFreeGb: 176,
    freeDiskPercent: 132,
    networkTx: 99,
    networkRx: 95,
    alert: 'CPU load above 95%',
  },
];

export const EVENT_LOG = [
  {time: '2:39 PM', text: 'Cloud_H100:i-00f2a87f369195b2b registered', tone: 'ok'},
  {time: '2:39 PM', text: 'Cloud_H100:i-00f2a87f369195b2b idle', tone: 'idle'},
  {time: '3:48 PM', text: 'DGX_H100:i-0037b9d2120509ea6 registered', tone: 'ok'},
  {time: '4:32 PM', text: 'Cloud_H100:i-00f2a87f369195b2b unregistered', tone: 'error'},
  {time: '5:10 PM', text: 'On_Prem_L40S:l40s-03 CPU load above 95%', tone: 'error'},
];
