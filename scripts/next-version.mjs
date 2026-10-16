// Picks the version of the next release. package.json's
// `version` holds the release line, and each release takes
// the next free number on it, after the highest existing
// tag:
//
//   1.0.0-beta (pre-release line) -> 1.0.0-beta.1, .2, ...
//   1.1 (stable line)             -> 1.1.0, 1.1.1, ...
//
// Run by the release workflow, which reads `version` and
// `prerelease` from $GITHUB_OUTPUT. Without it, prints them

import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  readFileSync
} from 'node:fs'

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `tags` are tag names (`v1.0.0-beta.3`); ones that aren't
// on the line are ignored
export function nextVersion(line, tags) {
  let first

  if (/^\d+\.\d+\.\d+-[0-9A-Za-z-]+$/.test(line))
    first = 1
  else if (/^\d+\.\d+$/.test(line))
    first = 0
  else
    throw new Error(
      `"${line}" isn't a release line: use X.Y or ` +
      'X.Y.Z-<word>, e.g. 1.1 or 1.0.0-beta'
    )

  const pattern = new RegExp(`^v${escape(line)}\\.(\\d+)$`)
  const numbers = tags
    .map(tag => pattern.exec(tag))
    .filter(match => match !== null)
    .map(match => Number(match[1]))

  const next = numbers.length > 0
    ? Math.max(...numbers) + 1
    : first

  return `${line}.${next}`
}

export const isPrerelease = version => version.includes('-')

function remoteTags() {
  const output = execFileSync(
    'git',
    ['ls-remote', '--tags', '--refs', 'origin'],
    { encoding: 'utf8' }
  )

  return output
    .split('\n')
    .filter(Boolean)
    .map(row => row.split('\t')[1].replace('refs/tags/', ''))
}

if (import.meta.main) {
  const pkg = JSON.parse(readFileSync(
    new URL('../package.json', import.meta.url), 'utf8'
  ))

  const version = nextVersion(pkg.version, remoteTags())
  const output =
    `version=${version}\n` +
    `prerelease=${isPrerelease(version)}\n`

  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, output)
  else
    process.stdout.write(output)
}
