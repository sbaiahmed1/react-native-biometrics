# Documentation Website

The documentation site for `@sbaiahmed1/react-native-biometrics`, built with [Docusaurus](https://docusaurus.io/) and published to GitHub Pages at https://sbaiahmed1.github.io/react-native-biometrics/.

All commands run from the **repository root** (this is a Yarn workspace — `npm` does not work here):

```bash
yarn docs:start   # local dev server with hot reload
yarn docs:build   # production build into website/build (broken links fail the build)
yarn docs:serve   # serve the production build locally (with the real /react-native-biometrics/ baseUrl)
```

Deployment happens automatically via `.github/workflows/deploy-docs.yml` on every push to `main` that touches `website/**`. Pull requests touching `website/**` run the build as a check without deploying.
