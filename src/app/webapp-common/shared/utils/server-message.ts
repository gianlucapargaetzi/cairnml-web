// The reason the server gave for a refused request, in plain words: the message of the error response, without the
// "Validation error (...)" wrapper. Undefined when the failure was not an answer of the server (the caller shows its own text).
export const serverMessage = (error: unknown): string | undefined => {
  const e = error as { error?: { meta?: { result_msg?: string } }; meta?: { result_msg?: string } } | null | undefined;
  const message = e?.error?.meta?.result_msg ?? e?.meta?.result_msg;
  if (!message) {
    return undefined;
  }
  const wrapped = /^Validation error \((.*)\)$/s.exec(message);
  return wrapped ? wrapped[1] : message;
};
