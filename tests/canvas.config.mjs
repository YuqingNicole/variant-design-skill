import {defineConfig} from '@playwright/test';
import path from 'node:path';
export default defineConfig({testDir:'.',testMatch:'canvas.spec.mjs',workers:1,reporter:'list',use:{headless:true,baseURL:'http://127.0.0.1:4198',channel:process.env.PLAYWRIGHT_CHANNEL||undefined},webServer:{command:'node ../website/server.mjs',url:'http://127.0.0.1:4198/api/status',env:{PORT:'4198',CANVAS_DATA_DIR:path.resolve('.generated/canvas-data')},reuseExistingServer:false}});
