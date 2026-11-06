#!/usr/bin/env python3
"""Build a reproducible, self-contained Codex compatibility package (stdlib only)."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent

def package_files(root=ROOT):
    root = Path(root)
    def read_source(path):
        path = Path(path)
        current = root
        for part in path.relative_to(root).parts:
            current = current / part
            if current.is_symlink():
                raise ValueError(f'Symlinks are not distributable: {current}')
        return path.read_bytes()

    manifest = json.loads(read_source(root / 'plugin/plugin.json'))
    files = {'.codex-plugin/plugin.json': (json.dumps(manifest, indent=2) + '\n').encode(),
             'LICENSE': read_source(root / 'LICENSE'), 'NOTICE': read_source(root / 'NOTICE')}
    for name in ('composerIcon', 'logo'):
        relative = manifest['interface'][name]
        if not relative.startswith('./assets/') or '..' in Path(relative).parts:
            raise ValueError('Icon path must remain inside plugin/assets')
        file = root / 'plugin' / relative
        files[relative[2:]] = read_source(file)
    # NOTICE and the Apache-2.0 text travel with the third-party references they cover (see NOTICE).
    source_files = [root / name for name in ('SKILL.md', 'VERSION', 'LICENSE', 'NOTICE', 'LICENSES/Apache-2.0.txt')]
    for folder in ('references', 'skills', 'scripts', 'assets'):
        if (root / folder).is_symlink():
            raise ValueError(f'Symlinks are not distributable: {root / folder}')
        for file in sorted((root / folder).rglob('*')):
            if file.is_symlink():
                raise ValueError(f'Symlinks are not distributable: {file}')
            if not file.is_file() or any(part.startswith('.') for part in file.relative_to(root).parts):
                continue
            if file.suffix not in ('.md', '.mjs', '.png', '.svg', '.jpg', '.json') or file.name.endswith('.test.mjs'):
                continue
            source_files.append(file)
    for file in source_files:
        relative = file.relative_to(root).as_posix()
        files[f'skills/variant-design/{relative}'] = read_source(file)
    # All paths inside the existing router remain relative to its own skill root.
    required = ('SKILL.md', 'skills/variant-generate/ROUTE.md', 'skills/shared/code-output.md',
                'references/workflow/project-context.md', 'scripts/variant-history.mjs', 'scripts/build-preview.mjs',
                'scripts/react-preview.mjs', 'scripts/preview-files.mjs', 'scripts/variant-integrate.mjs', 'scripts/quality-gate.mjs', 'scripts/artifact-verification.mjs',
                'scripts/browser-verification.mjs', 'scripts/verification-plan.mjs', 'scripts/project-profile.mjs', 'scripts/project-dependencies.mjs', 'scripts/dependency-references.mjs', 'scripts/design-task.mjs', 'references/workflow/project-discovery.md',
                'scripts/direction-card.mjs', 'references/sources/direction-cards.md', 'scripts/delivery-check.mjs', 'scripts/delivery-receipt.mjs', 'scripts/ds-export.mjs', 'scripts/ds-check.mjs', 'scripts/ds-tokens.mjs', 'scripts/style-budget.mjs', 'references/workflow/adjective-translation.md',
                'references/workflow/preview.md', 'references/workflow/history.md', 'skills/shared/export.md',
                'skills/variant-generate/actions.md', 'skills/variant-generate/zones.md')
    for name in required:
        if f'skills/variant-design/{name}' not in files:
            raise ValueError(f'Missing runtime dependency: {name}')
    files['CONTENTS.sha256'] = ''.join(f'{hashlib.sha256(data).hexdigest()}  {name}\n' for name, data in sorted(files.items())).encode()
    return files

def build(output, root=ROOT):
    files = package_files(root)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        raise FileExistsError(f'Refusing to overwrite existing package: {output}')
    descriptor, temporary_name = tempfile.mkstemp(prefix=f'.{output.name}.', suffix='.tmp', dir=output.parent)
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in sorted(files.items()):
                entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = 0o100644 << 16
                archive.writestr(entry, data)
        # A same-directory hard link publishes atomically and fails if another process created output.
        os.link(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    return len(files)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    print(f'Packaged {build(args.output)} files: {args.output}')
