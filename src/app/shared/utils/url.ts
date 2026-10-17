import {HTTP} from '~/app.constants';

export const isFileserverUrl = (url: string) =>
  url?.startsWith(HTTP.FILE_BASE_URL);

export const convertToReverseProxy = (url: string) => {
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith('/files')) {
      u.protocol = window.location.protocol;
      u.host = window.location.host;
      u.pathname = 'files' + u.pathname;
      return u.toString();
    }
  } catch {}
  return url;
};

const DATACHUNK_PREFIX = 'datachunk://';

export const isDatachunkUrl = (url?: string) =>
  !!url && url.startsWith(DATACHUNK_PREFIX);

/**
 * A stored datachunk, datachunk://<kind>/<task>/<name>, as the URL the browser loads on this origin:
 * /datachunks/<kind>/<task>/<name>. The API server answers with a redirect to a signed URL in the store.
 * Segments may already be percent-encoded (the SDK quotes them), so they are decoded before being encoded once.
 */
export const datachunkBrowserUrl = (url: string) => {
  const segments = url.slice(DATACHUNK_PREFIX.length).split('/').map(segment => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  const [kind, task, ...name] = segments;
  return `${window.location.origin}/datachunks/${encodeURIComponent(kind)}/${encodeURIComponent(task)}/` +
    name.map(part => encodeURIComponent(part)).join('/');
};
