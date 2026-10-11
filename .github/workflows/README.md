# Workflow files

## sledge (app)

### ci

[trigger] on push to any branch (except pushes that only change `*.md`, `LICENSE` or `assets/**`), or manual run

Quality checks. Each job runs only when its files changed, and always on a manual run.

- **TypeScript Quality & Tests**: type check, Prettier, ESLint and Vitest (unit + e2e). Runs on changes to TS/JS/JSON/CSS sources, package manifests, the lockfile, TS/Vite/Vitest configs, or `ci.yml`.
- **Rust Quality Checks**: rustfmt, clippy and `cargo check` for `src-tauri` and `wasm`. Runs on changes to those directories, Cargo manifests and lockfiles, or `ci.yml`.

### development_build

[trigger] on any push to `develop`, or manual run

Workflow for build sledge in development environment.
This creates artifacts (kept for 3 days), but **does not upload releases**.

### dev_release

[trigger] on push of the `dev-release` tag, or manual run

Workflow for releasing development versions to the dev update channel (the `dev-latest` pre-release).

1. Computes the next dev version `<version>-dev.<n>` from `src-tauri/Cargo.toml` and the existing `v<version>-dev.*` tags, and tags the commit with it. The tag is kept even if the run fails, so the next run uses the next number.
2. Builds all platforms into a draft staging release for that tag.
3. Once every build has succeeded and `latest.json` covers every platform, **replaces the `dev-latest` release** with those assets. If anything fails before this point, `dev-latest` keeps the previous build.
4. Archives the assets as a workflow artifact (kept for 30 days), then deletes the staging release and the `dev-release` tag.

### release

[trigger] on push of a tag matching `v*.*.*` (except `v*.*.*-dev.*`)

Workflow for releasing stable versions of the project.
This creates artifacts and **uploads them, with `latest.json`, to a draft release** for the tag. Review and publish it manually; once published it becomes the latest release, which the stable update channel reads.

## Note

- These workflows are designed to work with [semantic versioning](https://semver.org/).
