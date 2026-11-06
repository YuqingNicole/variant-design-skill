# Installation package integrity — 2026-11-06

## Change

Added a stdlib-only verifier for the Codex ZIP. It reads members without extracting, rejects unsafe or duplicate names, links and unsupported entry types, encrypted or oversized entries, validates CRC while reading, verifies that the SHA-256 inventory covers every payload exactly once, and checks the plugin name, version, entrypoint and icons. The builder now rejects symlinked source paths and publishes through an atomic same-directory link that will not replace an existing artifact.

## Evidence

- `python3 scripts/plugin-package.test.py`: 6 passed. The suite includes reproducibility, clean temporary unpack and helper execution, unsafe path, duplicate member, altered content, symlinked source and overwrite refusal cases.
- `python3 -m py_compile scripts/build-plugin.py scripts/verify-plugin.py scripts/plugin-package.test.py`: passed.
- `git diff --check`: passed.
- Fresh artifact `/Users/nicole/orca/variant-backlog-evidence/variant-design-installation-check-final.zip`: verifier reports `valid`, 104 files, version `1.1.0`, and 1,318,308 uncompressed bytes.
- The local Codex 0.166.0-alpha.6 protocol schema exposes `skills/list` with `cwds` and `forceReload`. A direct `codex app-server --stdio` invocation on this CLI exited successfully without starting a usable stdio server, so no installed-skill discovery result is claimed.

## Boundary

This evidence strengthens archive validation and local package smoke coverage. It does not close D1: clean installation and discovery through the actual Codex plugin manager, including upgrade discovery, remain pending. No ZIP was uploaded, no marketplace listing was submitted, and no global plugin/configuration was changed.
