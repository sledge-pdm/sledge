## dev.yml

When: Something merged or committed in develop branch
Build: Yes
Build Type: Release
Create Artifacts: Yes
Create Releases: No

## development_release.yml

When: "vX.X.X-dev.X" tag pushed in any branches
Build: Yes
Build Type: Release
Create Artifacts: Yes
Create Release: Yes

## release.yml

When: "vX.X.X" / "vX.X.X-prealpha" tag pushed in any branches (not triggered when the tag is "vX.X.X-dev.X")
Build: Yes
Build Type: Release
Create Artifacts: Yes
Create Release: Yes