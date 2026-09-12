#!/usr/bin/env node

/**
 * bundle_mediapipe.js
 * 
 * Bundles MediaPipe dependencies into frontend/vendor/mediapipe for offline APK builds,
 * and updates frontend/index.html script references.
 * 
 * Usage:
 *   node scripts/bundle_mediapipe.js           # Bundle MediaPipe & update index.html
 *   node scripts/bundle_mediapipe.js --restore # Restore index.html to CDN references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const vendorMediaPipeDir = path.join(frontendDir, 'vendor', 'mediapipe');
const indexHtmlPath = path.join(frontendDir, 'index.html');

const REPLACEMENTS = [
    {
        cdn: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        local: 'vendor/mediapipe/camera_utils/camera_utils.js'
    },
    {
        cdn: 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        local: 'vendor/mediapipe/control_utils/control_utils.js'
    },
    {
        cdn: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        local: 'vendor/mediapipe/drawing_utils/drawing_utils.js'
    },
    {
        cdn: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
        local: 'vendor/mediapipe/pose/pose.js'
    }
];

function updateIndexHtml(toLocal = true) {
    if (!fs.existsSync(indexHtmlPath)) {
        console.error(`Error: index.html not found at ${indexHtmlPath}`);
        return;
    }

    let content = fs.readFileSync(indexHtmlPath, 'utf8');
    let modified = false;

    for (const pair of REPLACEMENTS) {
        const from = toLocal ? pair.cdn : pair.local;
        const to = toLocal ? pair.local : pair.cdn;
        if (content.includes(from)) {
            content = content.split(from).join(to);
            console.log(`[index.html] Replaced: ${from} -> ${to}`);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(indexHtmlPath, content, 'utf8');
        console.log(`Successfully updated ${indexHtmlPath} (${toLocal ? 'local bundle' : 'CDN mode'}).`);
    } else {
        console.log(`No replacements needed in index.html (already ${toLocal ? 'local bundle' : 'CDN mode'}).`);
    }
}

function bundle() {
    console.log('=== Bundling MediaPipe for APK ===');

    const nodeModulesMediaPipe = path.join(rootDir, 'node_modules', '@mediapipe');
    const packages = ['camera_utils', 'control_utils', 'drawing_utils', 'pose'];

    // Ensure @mediapipe packages exist in node_modules
    const missing = packages.filter(pkg => !fs.existsSync(path.join(nodeModulesMediaPipe, pkg)));
    if (missing.length > 0) {
        console.log(`Missing packages in node_modules: ${missing.join(', ')}. Installing via npm...`);
        const installTargets = missing.map(pkg => `@mediapipe/${pkg}`).join(' ');
        execSync(`npm install ${installTargets}`, { cwd: rootDir, stdio: 'inherit' });
    }

    // Copy to frontend/vendor/mediapipe
    fs.mkdirSync(vendorMediaPipeDir, { recursive: true });

    for (const pkg of packages) {
        const src = path.join(nodeModulesMediaPipe, pkg);
        const dest = path.join(vendorMediaPipeDir, pkg);
        if (fs.existsSync(src)) {
            console.log(`Copying ${pkg} -> ${dest}`);
            fs.cpSync(src, dest, { recursive: true });
        } else {
            console.warn(`Warning: source directory ${src} does not exist!`);
        }
    }

    updateIndexHtml(true);
    console.log('MediaPipe bundling complete.');
}

function restore() {
    console.log('=== Restoring MediaPipe CDN references ===');
    updateIndexHtml(false);
    console.log('MediaPipe CDN restoration complete.');
}

const isRestore = process.argv.includes('--restore');
if (isRestore) {
    restore();
} else {
    bundle();
}
