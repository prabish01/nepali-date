# Releasing to the community

The working package name is `@prabish01/nepali-date`, version `0.1.0`.
GitHub identity is `prabish01`; npm account/scope ownership is not assumed.
No automatic publish workflow or registry credentials are included.

## Before the first release

- Confirm the npm scope/name under your own account; update package metadata,
  examples and type fixtures together if the name changes.
- Create or choose the GitHub repository. Set actual `repository`, `bugs` and
  project `homepage` metadata after its URL is known. Do not use nonexistent URLs.
- Review calendar sources, the transcribed 2083 holiday categories, documented
  pending observances and the absence of a bundled daily tithi almanac.
- Run `npm ci` and `npm run check`; inspect CI on the supported Node/timezone matrix.
- Update the changelog from Unreleased to the actual release date.
- Check author attribution: Prabish Dangi, LinkedIn link, no assistant co-author
  trailers. Keep MIT and upstream Apache-2.0 notices in the archive.

## Build and inspect

```sh
npm run check
npm pack --dry-run
npm pack
```

`npm pack` runs `prepack`: build and calendar/unit tests. `npm run check` also
validates TypeScript, a browser bundle and an offline tarball installation with
both module systems. The archive contains `dist/`, data, license notices and
documentation; it excludes tests, development dependencies and repository settings.

Install the generated `.tgz` in a separate application before publishing.

## Publish when ready

```sh
npm login
npm whoami
npm publish --access public
```

Use npm's current authentication/2FA or trusted-publishing requirements. Never
commit tokens. Publish only after confirming the chosen name and package contents.
Tag the release and write release notes showing supported ranges and data changes.
Corrected month lengths may shift later conversions; call that out explicitly.

## GitHub profile

LinkedIn: https://www.linkedin.com/in/prabish-dangi-04a649211/

The LinkedIn social link already exists on `prabish01`. Adding it to the bio
through the CLI needs a token with the `user` scope. If necessary, authenticate
with `gh auth refresh -h github.com -s user` and then update the bio.

Once the public repository exists, open https://github.com/prabish01, choose
**Customize your pins**, select the package repository, and save. GitHub's
available public GraphQL schema has no profile repository-pin mutation; issue
pinning operations are unrelated.
