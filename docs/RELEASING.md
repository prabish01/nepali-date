# Releasing to the community

Package: `@prabish01/nepali-date` on [npm](https://www.npmjs.com/package/@prabish01/nepali-date).
Repository: https://github.com/prabish01/nepali-date.

Version 0.1.1 is published. The interactive showcase lives in `showcase/` and
is deployed independently from the npm package. No automatic npm publish
workflow or registry credentials are included.

## Prepare a release

- Review the diff and use a new version for every publication, including README-only
  updates. npm does not refresh its package README from a GitHub push.
- Compare `package.json` with `npm view @prabish01/nepali-date version`. Use a
  version that has not been published, and update the lockfile and changelog
  together. A published version cannot be overwritten.
- Replace the pending changelog heading with the actual publication date.
- Keep package repository links and installation examples current. Do not describe
  a published package as unpublished or its established name as proposed.
- Review data sources, documented coverage and pending observances when changing
  datasets. Keep Prabish Dangi's author attribution and all required licenses.
- Run the checks and inspect the archive before publishing.

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

Use the authenticated npm account with publish access and complete npm's required
2FA challenge. Never commit tokens. After publication, verify the registry:

```sh
npm view @prabish01/nepali-date version
```

Check the npm page for the new README. Commit and push the release files using
your own Git identity, without assistant co-author trailers. Tag the release and
write release notes showing supported ranges and data changes. Corrected month
lengths can shift later conversions; explain any such change explicitly.

For subsequent releases, choose the version after checking the registry. Use
`npm version patch --no-git-tag-version` for a patch once the prior release is
published, then update the changelog, verify, commit and publish.
