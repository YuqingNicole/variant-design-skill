import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('builder', Path(__file__).with_name('build-plugin.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class PackageTests(unittest.TestCase):
    def test_reproducible_complete_package_runs_outside_repository(self):
        with tempfile.TemporaryDirectory(prefix='variant-plugin-') as directory:
            root = Path(directory)
            first, second = root/'first.zip', root/'second.zip'
            builder.build(first); builder.build(second)
            self.assertEqual(first.read_bytes(), second.read_bytes())
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

if __name__ == '__main__': unittest.main()
