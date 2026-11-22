import { GeneratedRecipe } from '@distro-tailor/core';

/** Pick a heredoc delimiter that cannot collide with any line in `content`. */
function safeDelimiter(content: string, index: number): string {
  let delim = `__DISTRO_TAILOR_FILE_${index}__`;
  while (content.includes(delim)) {
    delim += '_X';
  }
  return delim;
}

/**
 * Generates a self-contained, ready-to-run shell script that extracts all
 * recipe files (including nested `stacks/<id>/docker-compose.yml` files),
 * applies executable bits, and prints the quickstart commands.
 */
export function generateRecipeBundleScript(recipe: GeneratedRecipe): string {
  const lines: string[] = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    `# DistroTailor Bundle: ${recipe.title}`,
    'OUT_DIR="${1:-./distro-recipe}"',
    'mkdir -p "$OUT_DIR"',
    'cd "$OUT_DIR"',
    ''
  ];

  recipe.files.forEach((file, idx) => {
    const delim = safeDelimiter(file.content, idx);
    const parentDir = file.filename.includes('/') ? file.filename.slice(0, file.filename.lastIndexOf('/')) : '';
    if (parentDir) {
      lines.push(`mkdir -p '${parentDir.replace(/'/g, "'\\''")}'`);
    }
    const safeTarget = file.filename.replace(/'/g, "'\\''");
    lines.push(`cat <<'${delim}' > '${safeTarget}'`);
    lines.push(file.content.replace(/\r\n/g, '\n').replace(/\n$/, ''));
    lines.push(delim);
    if (file.executable) {
      lines.push(`chmod +x '${safeTarget}'`);
    }
    lines.push('');
  });

  lines.push('echo "✔ Extracted all recipe files to: $(pwd)"');
  lines.push('echo "Next steps:"');
  lines.push('echo "  cd $OUT_DIR"');
  for (const cmd of recipe.quickstartCommands) {
    lines.push(`echo "  ${cmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  }
  lines.push('');

  return lines.join('\n');
}
