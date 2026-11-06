#!/usr/bin/env python3
"""Verify a Variant Design plugin ZIP without extracting or executing it."""
import argparse
import hashlib
import json
from pathlib import PurePosixPath
import re
import stat
import sys
import zipfile

MAX_FILES = 2_000
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_PACKAGE_BYTES = 100 * 1024 * 1024
SKILL_ROOT = 'skills/variant-design/'

class PackageError(ValueError):
    pass

def safe_name(name):
    path = PurePosixPath(name)
    return (name and '\\' not in name and not name.startswith('/') and
            ':' not in name.split('/')[0] and
            all(part not in ('', '.', '..') for part in name.split('/')) and
            not path.is_absolute())

def verify(path):
    try:
        with zipfile.ZipFile(path) as archive:
            entries = archive.infolist()
            if not entries or len(entries) > MAX_FILES:
                raise PackageError(f'Invalid package file count: {len(entries)} (limit {MAX_FILES})')
            by_name = {}
            total = 0
            for info in entries:
                if not safe_name(info.filename):
                    raise PackageError(f'Unsafe archive path: {info.filename!r}')
                if info.filename in by_name:
                    raise PackageError(f'Duplicate archive path: {info.filename}')
                if info.is_dir():
                    raise PackageError(f'Unexpected directory entry: {info.filename}')
                mode = info.external_attr >> 16
                if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG)):
                    raise PackageError(f'Unsupported archive entry type: {info.filename}')
                if info.flag_bits & 1:
                    raise PackageError(f'Encrypted entry is not supported: {info.filename}')
                if info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
                    raise PackageError(f'Unsupported compression method: {info.filename}')
                if info.file_size > MAX_FILE_BYTES:
                    raise PackageError(f'Entry exceeds {MAX_FILE_BYTES} bytes: {info.filename}')
                total += info.file_size
                if total > MAX_PACKAGE_BYTES:
                    raise PackageError(f'Package exceeds {MAX_PACKAGE_BYTES} uncompressed bytes')
                by_name[info.filename] = info

            required = {'.codex-plugin/plugin.json', 'CONTENTS.sha256',
                        SKILL_ROOT + 'SKILL.md', SKILL_ROOT + 'VERSION',
                        SKILL_ROOT + 'LICENSE', SKILL_ROOT + 'NOTICE'}
            missing = sorted(required - by_name.keys())
            if missing:
                raise PackageError('Missing required package files: ' + ', '.join(missing))

            content = {}
            for name, info in by_name.items():
                digest = hashlib.sha256()
                actual = 0
                with archive.open(info) as source:
                    while chunk := source.read(64 * 1024):
                        actual += len(chunk)
                        if actual > info.file_size or actual > MAX_FILE_BYTES:
                            raise PackageError(f'Entry expands beyond its declared size: {name}')
                        digest.update(chunk)
                if actual != info.file_size:
                    raise PackageError(f'Entry size does not match ZIP metadata: {name}')
                content[name] = digest.hexdigest()

            inventory = archive.read('CONTENTS.sha256').decode('utf-8')
            declared = {}
            for number, line in enumerate(inventory.splitlines(), 1):
                match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
                if not match:
                    raise PackageError(f'Invalid checksum inventory line {number}')
                digest, name = match.groups()
                if not safe_name(name) or name == 'CONTENTS.sha256' or name in declared:
                    raise PackageError(f'Invalid or duplicate checksum path on line {number}: {name}')
                declared[name] = digest
            actual_files = set(by_name) - {'CONTENTS.sha256'}
            if set(declared) != actual_files:
                absent = sorted(actual_files - set(declared))
                extra = sorted(set(declared) - actual_files)
                raise PackageError(f'Checksum inventory mismatch (unlisted: {absent}; missing files: {extra})')
            for name, expected in declared.items():
                if content[name] != expected:
                    raise PackageError(f'Checksum mismatch: {name}')

            try:
                manifest = json.loads(archive.read('.codex-plugin/plugin.json'))
                version = archive.read(SKILL_ROOT + 'VERSION').decode('utf-8').strip()
                skill = archive.read(SKILL_ROOT + 'SKILL.md').decode('utf-8')
            except (UnicodeDecodeError, json.JSONDecodeError) as error:
                raise PackageError(f'Invalid plugin metadata: {error}') from error
            if not isinstance(manifest, dict):
                raise PackageError('Plugin manifest must be a JSON object')
            if manifest.get('name') != 'variant-design' or not isinstance(manifest.get('version'), str) or not manifest['version']:
                raise PackageError('Plugin manifest must identify variant-design and a version')
            if manifest['version'] != version:
                raise PackageError(f'Version mismatch: plugin manifest {manifest["version"]}, skill {version}')
            if not skill.startswith('---\nname: variant-design\n'):
                raise PackageError('Packaged entrypoint is not the variant-design skill router')
            interface = manifest.get('interface', {})
            if not isinstance(interface, dict):
                raise PackageError('Plugin interface metadata must be an object')
            for field in ('composerIcon', 'logo'):
                icon_value = interface.get(field)
                if not isinstance(icon_value, str):
                    raise PackageError(f'Plugin {field} must be a relative path')
                icon = icon_value.removeprefix('./')
                if not safe_name(icon) or icon not in by_name:
                    raise PackageError(f'Plugin {field} does not point to a packaged file')
            return {'status': 'valid', 'name': manifest['name'], 'version': version,
                    'files': len(entries), 'uncompressedBytes': total}
    except (OSError, zipfile.BadZipFile, UnicodeDecodeError) as error:
        raise PackageError(f'Cannot read plugin ZIP: {error}') from error

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('package')
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.package), sort_keys=True))
    except PackageError as error:
        print(f'Invalid plugin package: {error}', file=sys.stderr)
        raise SystemExit(1)
