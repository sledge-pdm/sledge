## dev.yml

When: Something merged or committed in develop branch
Build: Yes
Build Type: Release (may need fix...)
Create Artifacts: No

## dev-with-artifacts.yml

When: "vX.X.X-dev.X" tag pushed in any branches
Build: Yes
Build Type: Release (may need fix...)
Create Artifacts: Yes

## release.yml

When: "vX.X.X" / "vX.X.X-prealpha" tag pushed in any branches (not triggered when the tag is "vX.X.X-dev.X")
Build: Yes
Build Type: Release
Create Artifacts: Yes