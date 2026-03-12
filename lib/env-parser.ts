export interface EnvVariable {
  name: string;
  value: string;
}

export interface EnvParseError {
  line: number;
  text: string;
  error: string;
}

export interface EnvParseResult {
  valid: EnvVariable[];
  errors: EnvParseError[];
}

export function parseEnvFile(text: string): EnvParseResult {
  const valid: EnvVariable[] = [];
  const errors: EnvParseError[] = [];
  const seenNames = new Set<string>();

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      errors.push({ line: i + 1, text: raw, error: 'Missing "=" separator' });
      continue;
    }

    const name = trimmed.slice(0, eqIndex).trim();
    if (name === '') {
      errors.push({ line: i + 1, text: raw, error: 'Empty variable name' });
      continue;
    }

    let value = trimmed.slice(eqIndex + 1);

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // Strip inline comments (only for unquoted values)
      const commentIndex = value.indexOf(' #');
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex);
      }
      value = value.trim();
    }

    if (seenNames.has(name)) {
      errors.push({ line: i + 1, text: raw, error: `Duplicate variable name "${name}"` });
      continue;
    }

    seenNames.add(name);
    valid.push({ name, value });
  }

  return { valid, errors };
}
