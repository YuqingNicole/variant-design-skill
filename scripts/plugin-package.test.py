import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('builder', Path(__file__).with_name('build-plugin.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
verifier_spec = importlib.util.spec_from_file_location('verifier', Path(__file__).with_name('verify-plugin.py'))
verifier = importlib.util.module_from_spec(verifier_spec)
verifier_spec.loader.exec_module(verifier)

class PackageTests(unittest.TestCase):
    def test_only_the_router_is_named_skill_md(self):
        # Codex and `npx skills` scan folders recursively, and Claude Code plugins register every
        # skills/<name>/SKILL.md. Sub-workflows are named ROUTE.md so they never load as standalone
        # skills whose relative paths break outside the router.
        root = Path(__file__).resolve().parent.parent
        named = sorted(str(p.relative_to(root)) for folder in ('skills', 'references', 'scripts', 'assets')
                       for p in (root/folder).rglob('SKILL.md'))
        self.assertEqual(named, [])
        self.assertTrue((root/'SKILL.md').read_text().startswith('---\nname: variant-design\n'))

    def test_third_party_files_carry_their_notice(self):
        # Apache-2.0 section 4: ship the license, keep the NOTICE attributions, mark each copied file.
        root = Path(__file__).resolve().parent.parent
        notice = (root/'NOTICE').read_text()
        listed = [line.strip() for line in notice.splitlines() if line.startswith('  references/')]
        self.assertEqual(len(listed), 7)
        for name in listed:
            self.assertTrue((root/name).read_text().startswith('<!-- From Impeccable ('), name)
        self.assertIn('Copyright 2025 Paul Bakaus', notice)
        self.assertIn('Apache License', (root/'LICENSES/Apache-2.0.txt').read_text())
        names = builder.package_files(root)
        for name in ('NOTICE', 'skills/variant-design/NOTICE', 'skills/variant-design/LICENSES/Apache-2.0.txt'):
            self.assertIn(name, names)

    def test_claude_marketplace_lists_only_the_router(self):
        root = Path(__file__).resolve().parent.parent
        marketplace = json.loads((root/'.claude-plugin/marketplace.json').read_text())
        self.assertFalse((root/'.claude-plugin/plugin.json').exists())
        [entry] = marketplace['plugins']
        self.assertEqual((marketplace['name'], entry['name'], entry['source'], entry['skills']), ('variant-design', 'variant-design', './', ['./']))
        # Claude Code pins installs to this version, so a release that skips it never reaches users.
        version = (root/'VERSION').read_text().strip()
        self.assertEqual(entry['version'], version)
        self.assertEqual(json.loads((root/'plugin/plugin.json').read_text())['version'], version)

    def test_version_record_matches_the_product_manifests(self):
        root = Path(__file__).resolve().parent.parent
        skill_version = (root/'VERSION').read_text().strip()
        website_version = json.loads((root/'website/package.json').read_text())['version']
        record = (root/'docs/versioning.md').read_text()
        self.assertIn(f'**Variant Design skill and plugin: `{skill_version}`**', record)
        self.assertIn(f'**Website package: `{website_version}`**', record)

    def test_reproducible_complete_package_runs_outside_repository(self):
        with tempfile.TemporaryDirectory(prefix='variant-plugin-') as directory:
            root = Path(directory)
            first, second = root/'first.zip', root/'second.zip'
            builder.build(first); builder.build(second)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(verifier.verify(first)['status'], 'valid')
            with self.assertRaisesRegex(FileExistsError, 'Refusing to overwrite'):
                builder.build(first)
            with zipfile.ZipFile(first) as archive:
                names = archive.namelist()
                self.assertFalse(any('node_modules' in name or '.env' in name or name.startswith('website/') for name in names))
                for line in archive.read('CONTENTS.sha256').decode().splitlines():
                    digest, name = line.split('  ', 1)
                    self.assertEqual(hashlib.sha256(archive.read(name)).hexdigest(), digest)
                archive.extractall(root/'installed')
            installed = root/'installed-alias'
            installed.symlink_to(root/'installed', target_is_directory=True)
            manifest = json.loads((installed/'.codex-plugin/plugin.json').read_text())
            for field in ('logo', 'composerIcon'):
                self.assertTrue((installed/manifest['interface'][field]).is_file())
            skill = installed/'skills/variant-design'
            output = root/'project/variant-output'; output.mkdir(parents=True)
            state = {'schemaVersion': 2, 'selectedVariant': None, 'variants': {}}
            for identifier in 'ABC':
                name = f'variant-{identifier}.html'
                (output/name).write_text(f'<main><!-- zone:hero:start --><h1>{identifier}</h1><!-- zone:hero:end --></main>')
                state['variants'][identifier] = {'entry':name, 'files':[name], 'version':1, 'tokens':{}, 'history':[], 'undo':[], 'comparison':{'optimizes':'Clarity','tradeoff':'Density','bestFor':'First visit'}}
            (output/'.variant-context.json').write_text(json.dumps(state))
            subprocess.run(['node', str(skill/'scripts/build-preview.mjs'), str(output)], cwd=root, check=True, capture_output=True)
            self.assertTrue((output/'_compare.html').exists())
            evidence = subprocess.run(['node',str(skill/'scripts/artifact-verification.mjs'),'run',str(output),'B'],cwd=root,capture_output=True,text=True)
            self.assertEqual(evidence.returncode, 2)
            self.assertEqual(json.loads(evidence.stdout)['status'], 'unverified')

            profile_run = subprocess.run(['node', str(skill/'scripts/project-profile.mjs'), 'scan', str(output.parent), 'variant-output/variant-B.html'], cwd=root, check=True, capture_output=True, text=True)
            profile = json.loads(profile_run.stdout)
            self.assertIn('variant-output/variant-B.html', profile['dependencyScope']['files'])
            self.assertEqual(profile['suitability']['integration'], 'unverified')
            profile_file = root/'profile.json'; profile_file.write_text(json.dumps(profile))
            brief = {'goal':'Inspect B','audience':'Author','route':'/B','coreTask':'Compare','allowedFiles':['variant-output/variant-B.html'],'preserve':['Heading'],'acceptance':['Heading visible'],'brandConstraints':[],'unknowns':[],'discoveryReview':[{'index':i,'status':'unresolved','reason':'Only fixture scope is covered','blocking':False} for i,_ in enumerate(profile['unknowns'])]}
            brief_file = root/'brief.json'; brief_file.write_text(json.dumps(brief))
            task_run = subprocess.run(['node', str(skill/'scripts/design-task.mjs'), 'create', str(profile_file), str(brief_file)], cwd=root, check=True, capture_output=True, text=True)
            self.assertEqual(json.loads(task_run.stdout)['readiness'], 'ready-for-candidate-work')
            candidate = root/'candidate'
            subprocess.run(['node',str(skill/'scripts/variant-history.mjs'),'prepare',str(output),'B',str(candidate)],cwd=root,check=True,capture_output=True)

            (candidate/'variant-B.html').write_text((output/'variant-B.html').read_text().replace('<h1>B</h1>', '<h1>Better B</h1>'))
            change = root/'change.json'; change.write_text(json.dumps({'summary':'hero edit','zone':'hero'}))
            original = (output/'variant-B.html').read_bytes()
            for action, rest in [('apply',[str(candidate),str(change)]), ('undo',[])]:
                subprocess.run(['node',str(skill/'scripts/variant-history.mjs'),action,str(output),'B',*rest],cwd=root,check=True,capture_output=True)
            self.assertEqual((output/'variant-B.html').read_bytes(),original)
            # The earlier candidate is stale even though undo restored the original bytes.
            refused = subprocess.run(['node',str(skill/'scripts/variant-history.mjs'),'apply',str(output),'B',str(candidate),str(change)],cwd=root,capture_output=True,text=True)
            self.assertNotEqual(refused.returncode, 0)
            self.assertIn('Candidate conflict', refused.stderr)
            self.assertEqual((output/'variant-B.html').read_bytes(),original)
            self.assertIsNone(json.loads((output/'.variant-context.json').read_text())['selectedVariant'])

    def test_verifier_rejects_unsafe_duplicate_and_corrupt_archives(self):
        with tempfile.TemporaryDirectory(prefix='variant-plugin-verify-') as directory:
            root = Path(directory)
            good = root/'good.zip'
            builder.build(good)
            with zipfile.ZipFile(good) as archive:
                entries = [(name, archive.read(name)) for name in archive.namelist()]
            variants = {
                'traversal.zip': entries + [('../escape', b'bad')],
                'duplicate.zip': entries + [('.codex-plugin/plugin.json', b'{}')],
                'corrupt.zip': [(name, b'corrupt' if name == 'skills/variant-design/SKILL.md' else data)
                                for name, data in entries],
            }
            for filename, changed in variants.items():
                package = root/filename
                with warnings.catch_warnings():
                    warnings.simplefilter('ignore', UserWarning)
                    with zipfile.ZipFile(package, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
                        for name, data in changed:
                            archive.writestr(name, data)
                with self.subTest(filename=filename), self.assertRaises(verifier.PackageError):
                    verifier.verify(package)

    def test_builder_rejects_symlinked_root_sources(self):
        root = Path(tempfile.mkdtemp(prefix='variant-plugin-symlink-'))
        try:
            (root/'plugin').mkdir()
            (root/'plugin/plugin.json').symlink_to(Path(__file__).resolve().parents[1]/'plugin/plugin.json')
            with self.assertRaisesRegex(ValueError, 'Symlinks are not distributable'):
                builder.package_files(root)
        finally:
            import shutil
            shutil.rmtree(root)

if __name__ == '__main__': unittest.main()
