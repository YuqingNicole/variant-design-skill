import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},define:{__REVIEW_LABEL__:JSON.stringify('Original Vite configuration')}});
