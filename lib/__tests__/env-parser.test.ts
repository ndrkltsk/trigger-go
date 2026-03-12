import { parseEnvFile } from '../env-parser';

describe('parseEnvFile', () => {
  it('parses standard NAME=value pairs', () => {
    const result = parseEnvFile('API_KEY=abc123\nDB_HOST=localhost');
    expect(result.valid).toEqual([
      { name: 'API_KEY', value: 'abc123' },
      { name: 'DB_HOST', value: 'localhost' },
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('handles double-quoted values', () => {
    const result = parseEnvFile('NAME="value with spaces"');
    expect(result.valid).toEqual([{ name: 'NAME', value: 'value with spaces' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('handles single-quoted values', () => {
    const result = parseEnvFile("NAME='value with spaces'");
    expect(result.valid).toEqual([{ name: 'NAME', value: 'value with spaces' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('skips comment lines', () => {
    const result = parseEnvFile('# This is a comment\nKEY=value\n# Another comment');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('skips empty lines', () => {
    const result = parseEnvFile('KEY1=value1\n\n\nKEY2=value2\n');
    expect(result.valid).toEqual([
      { name: 'KEY1', value: 'value1' },
      { name: 'KEY2', value: 'value2' },
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('strips inline comments from unquoted values', () => {
    const result = parseEnvFile('KEY=value # this is a comment');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('preserves inline comment syntax inside quoted values', () => {
    const result = parseEnvFile('KEY="value # not a comment"');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value # not a comment' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for lines missing "="', () => {
    const result = parseEnvFile('INVALID_LINE\nKEY=value');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value' }]);
    expect(result.errors).toEqual([
      { line: 1, text: 'INVALID_LINE', error: 'Missing "=" separator' },
    ]);
  });

  it('returns error for empty variable names', () => {
    const result = parseEnvFile('=value');
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toEqual([
      { line: 1, text: '=value', error: 'Empty variable name' },
    ]);
  });

  it('detects duplicate variable names', () => {
    const result = parseEnvFile('KEY=value1\nKEY=value2');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value1' }]);
    expect(result.errors).toEqual([
      { line: 2, text: 'KEY=value2', error: 'Duplicate variable name "KEY"' },
    ]);
  });

  it('handles empty values', () => {
    const result = parseEnvFile('KEY=');
    expect(result.valid).toEqual([{ name: 'KEY', value: '' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('handles values with equals signs', () => {
    const result = parseEnvFile('KEY=value=with=equals');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value=with=equals' }]);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty result for empty input', () => {
    const result = parseEnvFile('');
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty result for only comments and empty lines', () => {
    const result = parseEnvFile('# comment\n\n# another comment\n');
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles mixed valid and invalid lines', () => {
    const input = [
      'VALID1=hello',
      'BAD LINE',
      '# comment',
      'VALID2="world"',
      '=no_name',
      'VALID1=duplicate',
    ].join('\n');

    const result = parseEnvFile(input);
    expect(result.valid).toEqual([
      { name: 'VALID1', value: 'hello' },
      { name: 'VALID2', value: 'world' },
    ]);
    expect(result.errors).toEqual([
      { line: 2, text: 'BAD LINE', error: 'Missing "=" separator' },
      { line: 5, text: '=no_name', error: 'Empty variable name' },
      { line: 6, text: 'VALID1=duplicate', error: 'Duplicate variable name "VALID1"' },
    ]);
  });

  it('trims whitespace around variable names', () => {
    const result = parseEnvFile('  KEY  =value');
    expect(result.valid).toEqual([{ name: 'KEY', value: 'value' }]);
  });
});
