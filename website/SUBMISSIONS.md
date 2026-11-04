# Submission intake and reviewed references

The form at `/submit` prepares a draft in the browser. It does not store it, call a model, or post an issue. The author copies the generated body into GitHub and submits it. Authors can supply an HTTPS image/video URL they host, or upload a local file in GitHub's issue editor and use its generated URL. Video needs a static poster. The site loads the reviewed URL directly; it does not copy submitted media into Git or Blob.

Permission covers this site's inspiration feed and detail pages. It does not grant download, reuse, MCP, redistribution or commercial-use rights. A checkbox is a declaration to review, not proof of authorship. Verify the source, authority and scope before admitting any record. Never use synthetic test permission as a real submission.

## Review a draft

After installing the website's dependencies, save the author's downloaded JSON outside tracked source. Independently check authorship, grant, media format and dimensions, credit, alt text and the withdrawal method. Prepare an editorial JSON file:

```json
{
  "id": "an-original-stable-id",
  "tag": "Interaction",
  "focus": { "zh": "What was actually observed, in Chinese", "en": "" },
  "application": { "zh": "Where it is useful, in Chinese", "en": "" },
  "media": {
    "width": 1200,
    "height": 750,
    "alt": { "zh": "Describe the actual media in Chinese", "en": "" }
  },
  "permissionRecord": "https://github.com/OWNER/REPO/issues/NUMBER",
  "review": { "by": "ACTUAL REVIEWER", "date": "YYYY-MM-DD" },
  "translations": { "en": { "status": "draft" } }
}
```

Replace every placeholder, including dimensions, reviewer and date, from actual evidence. Unreviewed machine English stays `draft`. When someone reviews the English, fill its text and set `status: "complete"` with `reviewedAt: "YYYY-MM-DD"`. Draft English appears in previews but stays out of the production feed, detail pages, language alternates, reference index, sitemap and `llms.txt`.

```sh
node website/scripts/submissions.mjs review /absolute/path/submission.json /absolute/path/editorial.json --output /absolute/path/candidate.json
```

This creates a candidate and leaves the published registry unchanged. Inspect it before admission:

```sh
node website/scripts/submissions.mjs admit /absolute/path/candidate.json
node website/scripts/submissions.mjs check
npm test --prefix website
npm run build --prefix website
```

Admission changes `website/src/authorized-references.json` locally. Submit its diff through a PR, inspect its preview and merge using the project's production policy. The client and prerender read the same validated registry. Records require the grant evidence URL, review identity/date, explicit scope, credit and media description. IDs cannot collide with existing link references or withdrawn records. The real registry stays empty until genuine grants are reviewed.

## Withdraw first, verify afterwards

Use a public withdrawal notice containing the actual date and a short reason in both languages:

```json
{ "date": "YYYY-MM-DD", "reason": { "zh": "作者撤回展示授权", "en": "The author withdrew display permission." } }
```

```sh
node website/scripts/submissions.mjs withdraw stable-id /absolute/path/notice.json
```

The current registry becomes a tombstone containing only ID, name, removal date and reason. Feed, media, scoped briefs and indexes exclude it; the old detail address displays an unindexed removal notice. Previously saved personal pack notes remain in the browser, labeled unavailable and excluded from briefs. Publish the removal before further authorship investigation. This does not erase old Git commits, earlier downloads or third-party caches. Link-only removals still require removing their source entry and related preview/media records; the authorized-reference CLI cannot alter an unrelated link record.

Each registry write takes a cooperative lock, preserves and verifies a backup under the website's `.variant-work/submissions/`, checks for intervening file changes, then renames a verified temporary file. Edited files and symlinks are refused; there is no force flag. A crash may leave a lock for manual investigation. Backups contain earlier permission/media records and must not be committed. This is a local editorial write, not a transaction with GitHub or production deployment.

## Tests

`website/scripts/submissions.test.mjs` exercises real admission/withdrawal, backup, drift/lock/symlink refusals and prerender/index behavior. `tests/submission.spec.mjs` uses the production form plus a separate copied app with synthetic records and self-generated media; it never inserts fake permissions into the real registry or posts a GitHub issue.
