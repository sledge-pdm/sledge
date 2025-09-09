# Workflow files

## sledge (app)

### development_build

[trigger] on any push to `develop`

Workflow for build sledge in development environment.
This creates artifacts, but **does not upload releases**.

### development_release

[trigger] on push to `develop` with tag `v*.*.*-dev*`

Workflow for releasing development versions of the project.
This creates artifacts and **uploads pre-release releases in draft**.

### release

[trigger] on push to `main` with tag `v*.*.*-*` (except `v*.*.*-dev*`)

Workflow for releasing stable versions of the project.
This creates artifacts and **uploads releases as latest release in draft**.

## website (sledge-rules.app)

### website-production

[trigger] only on manual dispatch

Workflow for deploying apps/website to vercel's production environment.
Note that production deployment is "staged" after action is completed. Go to [deployments](https://vercel.com/innsblucks-projects/sledge/deployments) page to promote it.

## Note

- These workflows are designed to work with [semantic versioning](https://semver.org/).
- All releases are uploaded as drafts. Please review and publish them manually.
