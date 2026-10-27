import {getBasePath} from '~/app.constants';

const DATACHUNK_PREFIX = 'datachunk://';

export const isDatachunkUrl = (url?: string) =>
  !!url && url.startsWith(DATACHUNK_PREFIX);

/**
 * A stored datachunk, datachunk://<kind>/<task>/<name>, as the URL the browser loads on this origin:
 * <base path>/datachunks/<kind>/<task>/<name>. The API server answers with a redirect to a signed URL in the store.
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
  return `${window.location.origin}${getBasePath()}/datachunks/${encodeURIComponent(kind)}/${encodeURIComponent(task)}/` +
    name.map(part => encodeURIComponent(part)).join('/');
};
