import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
function inspect(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (
      /\.(html|js|json|xml|txt)$/.test(file) &&
      /APPROVAL_REQUIRED|NONPRODUCTION|Owner review preview|\bPLACEHOLDER\b/.test(
        readFileSync(file, 'utf8'),
      )
    )
      throw new Error(`Unapproved preview content in ${file}`);
  }
}
inspect('dist');
