# Security Policy

## Supported versions

Shisei is an early release (v0.1.x). Only the latest release and the `main` branch receive fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

- Preferred: use GitHub's **private vulnerability reporting** ("Security" tab → "Report a vulnerability").
- Or email **hello@wqu.guru** with "Shisei security" in the subject.

Include what you found, how to reproduce it (a URL, a deep link or a file) and the impact you expect. We aim to
acknowledge reports within 7 days and to agree on a fix and disclosure date with you.

## What is in scope

- The static gallery: cross-site scripting through deep links, query strings or catalog fields, and anything that
  makes the page load content from somewhere other than its own origin.
- The tools in `tools/` and the CI workflow: unsafe handling of paths or input files.
- Release assets: a zip whose checksum does not match the published `.sha256`.

## Also report privately

Images are part of the product. If you find an image that seems to depict a real, identifiable person or a minor, or
that still carries metadata, report it the same way; we treat it with the same priority as a security issue.
