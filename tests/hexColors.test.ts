import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../');

function getFiles(dir: string): string[] {
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map((subdir) => {
    const res = path.resolve(dir, subdir);
    // Exclude build artifacts, node_modules, and test files
    if (
      res.includes('node_modules') ||
      res.includes('.git') ||
      res.includes('dist') ||
      res.includes('dev-dist') ||
      res.includes('tests') ||
      res.includes('themes') ||
      res.includes('.claude')
    ) {
      return [];
    }
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return files.flat();
}

describe('Hex Color Detection', () => {
  it('should not contain hardcoded hex colors in source files (.ts, .tsx)', () => {
    const files = getFiles(SRC_DIR).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.tsx')
    );

    // Exclude configuration files and theme helper itself
    const targetFiles = files.filter(
      (file) =>
        !file.endsWith('vite.config.ts') &&
        !file.endsWith('themeHelper.ts')
    );

    // Regex to detect hex color codes: # followed by 3, 4, 6 or 8 hexadecimal digits
    const hexColorRegex = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    const violations: string[] = [];

    targetFiles.forEach((filePath) => {
      const relativePath = path.relative(SRC_DIR, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const matches = line.match(hexColorRegex);
        if (matches) {
          matches.forEach((match) => {
            violations.push(`${relativePath}:${index + 1} -> Found "${match}" in: "${line.trim()}"`);
          });
        }
      });
    });

    if (violations.length > 0) {
      console.warn('Hex color violations found in code:');
      violations.forEach((v) => console.warn(`  ${v}`));
    }

    expect(violations.length).toBe(0);
  });
});
