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

# 🖥️ CairnML Web

The browser interface of CairnML. It ships with the [CairnML server](https://github.com/gianlucapargaetzi/cairnml-server), so there is nothing to install separately.

## 🧰 Prerequisites

- 🖥️ A running [CairnML server](https://github.com/gianlucapargaetzi/cairnml-server)

## 🌐 Open it

Open `http://<server-ip>:8080` in your browser and sign in.

## 🛠️ Build from source

Needs Node.js 24 and pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm run build
```

## 🆘 Having problems

1. Check the [open issues](https://github.com/gianlucapargaetzi/cairnml-web/issues).
2. If your problem is not listed, [open a new issue](https://github.com/gianlucapargaetzi/cairnml-web/issues/new) with the page you were on and the full error message.

## 📄 License

Apache License 2.0, see [LICENSE](LICENSE). Unofficial fork of ClearML's web app, see [DISCLAIMER.md](DISCLAIMER.md).
