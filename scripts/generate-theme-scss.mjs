// Sass can't import JSON directly, so this turns app/config/themes.json
// into a Sass map ($appThemes) that the style helpers import. The JSON
// file stays the single source of truth, since the app also reads it.

import { readFileSync, writeFileSync } from 'node:fs';

const source = new URL('../app/config/themes.json', import.meta.url);
const target = new URL('../app/styles/helpers/_themes.generated.scss', import.meta.url);

function toSass(value, indent = '') {
  if (value !== null && typeof value === 'object') {
    const inner = indent + '  ';
    const entries = Object.entries(value)
      .map(([key, val]) => `${inner}"${key}": ${toSass(val, inner)}`);

    return `(\n${entries.join(',\n')}\n${indent})`;
  }

  // Strings are emitted unquoted so colors like #FFFFFF stay Sass colors.
  return String(value);
}

const json = JSON.parse(readFileSync(source, 'utf8'));
const scss = Object.entries(json)
  .map(([name, value]) => `$${name}: ${toSass(value)};`)
  .join('\n\n');

writeFileSync(target, `// Generated from app/config/themes.json - do not edit.\n\n${scss}\n`);
