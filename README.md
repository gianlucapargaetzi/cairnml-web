<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/cairnml-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/cairnml-logo.svg">
    <img src="assets/cairnml-logo.svg" alt="CairnML" width="480">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/gianlucapargaetzi/cairnml-web/actions/workflows/build.yml"><img src="https://github.com/gianlucapargaetzi/cairnml-web/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/gianlucapargaetzi/cairnml-web/stargazers"><img src="https://img.shields.io/github/stars/gianlucapargaetzi/cairnml-web?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/gianlucapargaetzi/cairnml-web/blob/main/LICENSE"><img src="https://img.shields.io/github/license/gianlucapargaetzi/cairnml-web?style=flat-square&color=green" alt="License"></a>
</p>

# CairnML Web

CairnML Web is the browser interface of CairnML. It shows your projects, experiments, datasets, workers and queues. The web app ships with the [CairnML server](https://github.com/gianlucapargaetzi/cairnml-server), so there is nothing to install separately.

## Features

- A dashboard with your projects and recent experiments.
- Project pages with tasks, experiments and models, and side-by-side comparisons.
- Datasets and their versions.
- Workers and queues, with the jobs waiting for them.
- Pipelines, reports and settings.

## Prerequisites

- A running [CairnML server](https://github.com/gianlucapargaetzi/cairnml-server)

## Open it

Open `http://<server-ip>/cairnml/` in your browser and sign in with your account. The web app talks to the server through the same address, so no further configuration is needed. If the server runs on another port, the address names it, for example `http://<server-ip>:8081/cairnml/`.

## Build from source

Building the interface from source needs Node.js 24 and pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm run build
```

The build output is written to `build/`.

## Having problems

1. Check the [open issues](https://github.com/gianlucapargaetzi/cairnml-web/issues).
2. If your problem is not listed, [open a new issue](https://github.com/gianlucapargaetzi/cairnml-web/issues/new) with the page you were on, your browser, and the full error message.

## License

Apache License 2.0, see [LICENSE](LICENSE). Unofficial fork of the ClearML web app, see [DISCLAIMER.md](DISCLAIMER.md).
