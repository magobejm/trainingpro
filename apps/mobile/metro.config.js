/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS config file */
// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force `zustand` to its CommonJS build on every platform. Zustand v5 ships an
// ESM build (`zustand/esm/*.mjs`) whose `devtools` middleware references
// `import.meta.env`. Metro doesn't transform `import.meta` in node_modules and
// the Expo web bundle is served as a classic `<script>` (not `type="module"`),
// so `import.meta` becomes a fatal `SyntaxError` that blanks the whole page.
// The CJS entrypoints (`zustand/index.js`, `zustand/middleware.js`, …) use
// `process.env` instead, which Metro handles fine.
const zustandDir = path.dirname(require.resolve('zustand/package.json'));
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand') {
    return { type: 'sourceFile', filePath: path.join(zustandDir, 'index.js') };
  }
  if (moduleName.startsWith('zustand/')) {
    const sub = moduleName.slice('zustand/'.length);
    return { type: 'sourceFile', filePath: path.join(zustandDir, `${sub}.js`) };
  }
  return (baseResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
