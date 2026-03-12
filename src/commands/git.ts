import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export interface GitHookOptions {
  force?: boolean;
}

/**
 * Installs git hooks that enforce provenance sidecars for AI artifacts.
 */
export function gitInstallHooksCommand(baseDir: string, options: GitHookOptions = {}): void {
  const gitDir = path.join(baseDir, '.git');
  if (!fs.existsSync(gitDir)) {
    throw new Error('No .git directory found. Run this command inside a git repository.');
  }

  const hooksDir = path.join(gitDir, 'hooks');
  fs.ensureDirSync(hooksDir);

  const preCommitPath = path.join(hooksDir, 'pre-commit');
  const prePushPath = path.join(hooksDir, 'pre-push');

  writeHook(preCommitPath, buildPreCommitHook(), options.force || false);
  writeHook(prePushPath, buildPrePushHook(), options.force || false);

  console.log(chalk.green('✅ Git hooks installed'));
  console.log(chalk.gray(`   ${path.relative(baseDir, preCommitPath)}`));
  console.log(chalk.gray(`   ${path.relative(baseDir, prePushPath)}`));
  console.log();
  console.log(chalk.bold('Enforced patterns:'));
  console.log(chalk.gray('  - *.patch'));
  console.log(chalk.gray('  - *.diff'));
  console.log(chalk.gray('  - files in ai/ directories'));
  console.log(chalk.gray('  - *.ai.* and *.generated.* files'));
  console.log();
  console.log(chalk.bold('Requirement:'));
  console.log(chalk.gray('  Each matching artifact must include staged sidecars:'));
  console.log(chalk.gray('  <artifact>.sig and <artifact>.prov.json'));
}

function writeHook(hookPath: string, content: string, force: boolean): void {
  if (fs.existsSync(hookPath) && !force) {
    throw new Error(`Hook already exists: ${path.basename(hookPath)} (use --force to overwrite).`);
  }

  fs.writeFileSync(hookPath, content, { mode: 0o755 });
  fs.chmodSync(hookPath, 0o755);
}

function buildPreCommitHook(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

AI_REGEX='(\\.patch$|\\.diff$|(^|/)ai/|\\.ai\\.|\\.generated\\.)'
STAGED_FILES="$(git diff --cached --name-only --diff-filter=ACM)"

if [ -z "\${STAGED_FILES}" ]; then
  exit 0
fi

MISSING=""

while IFS= read -r FILE; do
  [ -z "\${FILE}" ] && continue

  if echo "\${FILE}" | grep -Eq "\${AI_REGEX}"; then
    SIG_FILE="\${FILE}.sig"
    PROV_FILE="\${FILE}.prov.json"

    if [ ! -f "\${SIG_FILE}" ] || [ ! -f "\${PROV_FILE}" ]; then
      MISSING="\${MISSING}\\n- \${FILE} (missing sidecar files)"
      continue
    fi

    if ! echo "\${STAGED_FILES}" | grep -Fxq "\${SIG_FILE}"; then
      MISSING="\${MISSING}\\n- \${FILE} (stage \${SIG_FILE})"
    fi

    if ! echo "\${STAGED_FILES}" | grep -Fxq "\${PROV_FILE}"; then
      MISSING="\${MISSING}\\n- \${FILE} (stage \${PROV_FILE})"
    fi
  fi
done <<EOF
\${STAGED_FILES}
EOF

if [ -n "\${MISSING}" ]; then
  echo "❌ Provenance hook blocked commit."
  echo "AI artifacts must include staged signature sidecars:"
  printf "%b\\n" "\${MISSING}"
  echo
  echo "Run: prvc sign <artifact>"
  exit 1
fi

exit 0
`;
}

function buildPrePushHook(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

AI_REGEX='(\\.patch$|\\.diff$|(^|/)ai/|\\.ai\\.|\\.generated\\.)'
TRACKED_FILES="$(git ls-files)"
MISSING=""

while IFS= read -r FILE; do
  [ -z "\${FILE}" ] && continue

  if echo "\${FILE}" | grep -Eq "\${AI_REGEX}"; then
    SIG_FILE="\${FILE}.sig"
    PROV_FILE="\${FILE}.prov.json"

    if [ ! -f "\${SIG_FILE}" ] || [ ! -f "\${PROV_FILE}" ]; then
      MISSING="\${MISSING}\\n- \${FILE}"
    fi
  fi
done <<EOF
\${TRACKED_FILES}
EOF

if [ -n "\${MISSING}" ]; then
  echo "❌ Provenance hook blocked push."
  echo "Some tracked AI artifacts are missing sidecars:"
  printf "%b\\n" "\${MISSING}"
  echo
  echo "Run: prvc sign <artifact> and commit sidecar files."
  exit 1
fi

exit 0
`;
}
