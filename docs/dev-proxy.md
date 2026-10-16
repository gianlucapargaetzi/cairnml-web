# Running the web app against the ClearML server fork

Written for: a developer who runs the web app with `ng serve` against the API server of the fork.

## The proxy

`proxy.config.mjs` forwards requests from the development server to the API server:

- every request to `/service/1/api/...` is sent to `http://localhost:8008` with the prefix removed;
- the cookies the API server sets are rewritten to the `localhost` domain, so the browser keeps them on the development server's address.

Start the development server with `pnpm start` (or `pnpm start-widgets` for the report widgets). The web app is then at `http://localhost:4200`.

## Signing in during development

Signing in goes through the identity provider, which sends the browser back to the API server and then to the web app. Three settings must agree with the address you use:

| Setting | Value for a local run | Where |
|---|---|---|
| API server's public address | `http://localhost:8008` | `CLEARML__apiserver__idp__public_url` |
| Web app's address (also the origin the API server accepts for cookie changes) | `http://localhost:4200` | `CLEARML__apiserver__idp__web_url` |
| Keycloak's redirect address for the web client | `http://localhost:8008/v2.8/login.idp_callback`, with `http://localhost:4200` as a web origin | `clearml-web` client in `deploy/idp/realm-mlops.json` (the deployed stack uses `mlops-clearml`) |

The session cookie is `SameSite=Strict`. It is set during the top-level redirect from the identity provider to `localhost:8008`, and that is the same site as the web app, so the browser keeps it.

## Things that are not the proxy

- Requests from the web app to the API server are made with the cookie, so they must go through the proxy (or be same-site). Do not point the web app at `http://localhost:8008` directly from a different port; the cookie will not be sent.
- The web app holds no credential of its own. A `credentials.json` file is no longer read, and was removed.
- The report widgets (`start-widgets`) use the same proxy.

## Checking that it works

1. Open `http://localhost:4200`. You should be sent to the identity provider.
2. Sign in and approve. You should land back in the web app, with your name shown.
3. Open the browser's developer tools: the requests to `/service/1/api/...` return 200, and the cookie for `localhost` is present.
