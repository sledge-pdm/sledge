import type { ReleaseData } from './Release';

export type os = 'sp' | 'macOS' | 'windows' | 'linux' | 'none';
export const osBuildInfos: { [key in os]: { name: string; extensions: string[]; information?: string } } = {
  windows: {
    name: 'Windows',
    extensions: ['exe'],
    // information: `Both installers (exe/msi) are supposed to work identically.`,
  },
  macOS: {
    name: 'macOS',
    extensions: ['dmg'],
    information: `After installation, enter the command below in bash.
(Note: you should enter this every time you update sledge.)

> xattr -rc /Applications/sledge.app`,
  },
  linux: {
    name: 'Linux',
    extensions: ['rpm', 'AppImage', 'deb'],
    information: `.deb       for Debian-based distros (e.g., Ubuntu)
.rpm       for Red Hat-based distros (e.g., Fedora, CentOS)
.AppImage  for portable applications`,
  },
  sp: {
    name: 'sp',
    extensions: [],
    information: 'Mobile builds are not available yet.',
  },
  none: {
    name: 'None',
    extensions: [],
    information: "Device not supported. (It seems you're using an uncommon device.)",
  },
};

const debugResponce = `{
  "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/242093818",
  "assets_url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/242093818/assets",
  "upload_url": "https://uploads.github.com/repos/Innsbluck-rh/sledge/releases/242093818/assets{?name,label}",
  "html_url": "https://github.com/Innsbluck-rh/sledge/releases/tag/v0.0.9-prealpha",
  "id": 242093818,
  "author": {
    "login": "github-actions[bot]",
    "id": 41898282,
    "node_id": "MDM6Qm90NDE4OTgyODI=",
    "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/github-actions%5Bbot%5D",
    "html_url": "https://github.com/apps/github-actions",
    "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
    "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
    "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
    "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
    "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
    "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
    "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
    "type": "Bot",
    "user_view_type": "public",
    "site_admin": false
  },
  "node_id": "RE_kwDOPXDgN84Obg76",
  "tag_name": "v0.0.9-prealpha",
  "target_commitish": "10d5058bfec218f903566db7d18a5cf39ee5bd18",
  "name": "v0.0.9-prealpha",
  "draft": false,
  "immutable": false,
  "prerelease": false,
  "created_at": "2025-08-24T10:25:42Z",
  "updated_at": "2025-08-24T10:34:15Z",
  "published_at": "2025-08-24T10:34:15Z",
  "assets": [
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285695090",
      "id": 285695090,
      "node_id": "RA_kwDOPXDgN84RB1xy",
      "name": "sledge-0.0.9-prealpha-1.x86_64.rpm",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 4987345,
      "digest": "sha256:7a79f80120eb78b32ad2611daaa87ef46346ebb7128d0ba2bbced935a2f7e4fc",
      "download_count": 2,
      "created_at": "2025-08-24T10:33:03Z",
      "updated_at": "2025-08-24T10:33:04Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge-0.0.9-prealpha-1.x86_64.rpm"
    },
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285694930",
      "id": 285694930,
      "node_id": "RA_kwDOPXDgN84RB1vS",
      "name": "sledge_0.0.9-prealpha_aarch64.dmg",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 4333728,
      "digest": "sha256:cf2c466361a6d040db0df6a52a6b293991c2cf657896616d8da8a01cd7fd6fe8",
      "download_count": 3,
      "created_at": "2025-08-24T10:30:40Z",
      "updated_at": "2025-08-24T10:30:40Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge_0.0.9-prealpha_aarch64.dmg"
    },
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285695091",
      "id": 285695091,
      "node_id": "RA_kwDOPXDgN84RB1xz",
      "name": "sledge_0.0.9-prealpha_amd64.AppImage",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 89507008,
      "digest": "sha256:ceca58f92f45eefe767c96aea20563ced47b282d6f96f1e4f79258d3fddfaa74",
      "download_count": 2,
      "created_at": "2025-08-24T10:33:04Z",
      "updated_at": "2025-08-24T10:33:08Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge_0.0.9-prealpha_amd64.AppImage"
    },
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285695088",
      "id": 285695088,
      "node_id": "RA_kwDOPXDgN84RB1xw",
      "name": "sledge_0.0.9-prealpha_amd64.deb",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 4985948,
      "digest": "sha256:cd48188954a4a6f59b5c22ee070c5d5c700048b56dd99a9b7d80e3cddff1e02c",
      "download_count": 2,
      "created_at": "2025-08-24T10:33:02Z",
      "updated_at": "2025-08-24T10:33:03Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge_0.0.9-prealpha_amd64.deb"
    },
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285695149",
      "id": 285695149,
      "node_id": "RA_kwDOPXDgN84RB1yt",
      "name": "sledge_0.0.9-prealpha_x64-setup.exe",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 3805862,
      "digest": "sha256:a7a670f4163c1a40869f6237dcb7c3f25c0bc21e290bf926d475fb80c626f9cb",
      "download_count": 1,
      "created_at": "2025-08-24T10:33:50Z",
      "updated_at": "2025-08-24T10:33:50Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge_0.0.9-prealpha_x64-setup.exe"
    },
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285695148",
      "id": 285695148,
      "node_id": "RA_kwDOPXDgN84RB1ys",
      "name": "sledge_0.0.9-prealpha_x64_en-US.msi",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 4612096,
      "digest": "sha256:a61064bc6f8355e390256662a900532a12a1687a07544703044bc374a13a32f2",
      "download_count": 4,
      "created_at": "2025-08-24T10:33:50Z",
      "updated_at": "2025-08-24T10:33:50Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge_0.0.9-prealpha_x64_en-US.msi"
    },
    {
      "url": "https://api.github.com/repos/Innsbluck-rh/sledge/releases/assets/285694931",
      "id": 285694931,
      "node_id": "RA_kwDOPXDgN84RB1vT",
      "name": "sledge_aarch64.app.tar.gz",
      "label": "",
      "uploader": {
        "login": "github-actions[bot]",
        "id": 41898282,
        "node_id": "MDM6Qm90NDE4OTgyODI=",
        "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/github-actions%5Bbot%5D",
        "html_url": "https://github.com/apps/github-actions",
        "followers_url": "https://api.github.com/users/github-actions%5Bbot%5D/followers",
        "following_url": "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
        "gists_url": "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
        "organizations_url": "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
        "repos_url": "https://api.github.com/users/github-actions%5Bbot%5D/repos",
        "events_url": "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
        "received_events_url": "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
        "type": "Bot",
        "user_view_type": "public",
        "site_admin": false
      },
      "content_type": "application/zip",
      "state": "uploaded",
      "size": 4314144,
      "digest": "sha256:e38e2637b913a4c9f9df9b495773d800ffc5df019a20bc1b6b09f66c6c6329f5",
      "download_count": 1,
      "created_at": "2025-08-24T10:30:41Z",
      "updated_at": "2025-08-24T10:30:42Z",
      "browser_download_url": "https://github.com/Innsbluck-rh/sledge/releases/download/v0.0.9-prealpha/sledge_aarch64.app.tar.gz"
    }
  ],
  "tarball_url": "https://api.github.com/repos/Innsbluck-rh/sledge/tarball/v0.0.9-prealpha",
  "zipball_url": "https://api.github.com/repos/Innsbluck-rh/sledge/zipball/v0.0.9-prealpha",
  "body": "",
  "mentions_count": 1
}`;

export const getDebugReleaseData = (): ReleaseData => {
  const json = JSON.parse(debugResponce);
  console.log(json);
  return json as ReleaseData;
};
// client side
export const getReleaseData = async (apiUrl: string, pat?: string): Promise<ReleaseData | undefined> => {
  try {
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: pat ? { Authorization: `Bearer ${pat}` } : {},
    });
    if (!response.ok) return undefined;

    const data = await response.json();

    return data;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

export const getLatestVersion = async (apiUrl: string, pat?: string): Promise<string | undefined> => {
  const data = await getReleaseData(apiUrl, pat);
  return data?.name;
};
