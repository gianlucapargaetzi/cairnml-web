// What an experiment is called on screen: the label its owner gave it (display_name), otherwise its task name.
// The task name is the task's identity and never changes with the label.
export const experimentLabel = (experiment: {name?: string; display_name?: string} | null | undefined): string =>
  experiment?.display_name || experiment?.name || '';
