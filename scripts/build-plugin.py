#!/usr/bin/env python3
"""Build a reproducible, self-contained Codex compatibility package (stdlib only)."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent

def package_files(root=ROOT):
    manifest = json.loads((root / 'plugin/plugin.json').read_text())
    files = {'.codex-plugin/plugin.json': (json.dumps(manifest, indent=2) + '\n').encode(),
             'LICENSE': (root / 'LICENSE').read_bytes()}
    for name in ('composerIcon', 'logo'):
        relative = manifest['interface'][name]
        if not relative.startswith('./assets/') or '..' in Path(relative).parts:
            raise ValueError('Icon path must remain inside plugin/assets')
        file = root / 'plugin' / relative
        if file.is_symlink():
            raise ValueError('Symlinks are not distributable')
        files[relative[2:]] = file.read_bytes()
    source_files = [root / name for name in ('SKILL.md', 'VERSION', 'LICENSE')]
    for folder in ('references', 'skills', 'scripts', 'assets'):
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
        files[f'skills/variant-design/{relative}'] = file.read_bytes()
    # All paths inside the existing router remain relative to its own skill root.
    required = ('SKILL.md', 'skills/variant-generate/SKILL.md', 'skills/shared/code-output.md',
                'references/project-context.md', 'scripts/variant-history.mjs', 'scripts/build-preview.mjs',
                'scripts/react-preview.mjs', 'scripts/quality-gate.mjs')
    for name in required:
        if f'skills/variant-design/{name}' not in files:
            raise ValueError(f'Missing runtime dependency: {name}')
    files['CONTENTS.sha256'] = ''.join(f'{hashlib.sha256(data).hexdigest()}  {name}\n' for name, data in sorted(files.items())).encode()
    return files

def build(output, root=ROOT):
    files = package_files(root)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in sorted(files.items()):
                entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = 0o100644 << 16
                archive.writestr(entry, data)
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    return len(files)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    print(f'Packaged {build(args.output)} files: {args.output}')
