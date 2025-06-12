import { compileTemplate, getProperty, setObjectProperty } from './utils';

describe('resolveTemplate', () => {
  it('should resolve a simple template with one variable', () => {
    const context = { name: 'Alice' };
    expect(compileTemplate('Hello ${name}', context)).toBe('Hello Alice');
  });

  it('should resolve a template with nested variables', () => {
    const context = { issue: { project: { key: 'PROJ' } } };
    expect(compileTemplate('Project key: ${issue.project.key}', context)).toBe('Project key: PROJ');
  });

  it('should handle multiple variables in a template', () => {
    const context = { a: 1, b: 2 };
    expect(compileTemplate('${a} + ${b} = ${a}', context)).toBe('1 + 2 = 1');
  });

  it('should return empty string for missing variables', () => {
    const context = {};
    expect(compileTemplate('Hello ${name}', context)).toBe('Hello ');
  });

  it('should trim whitespace in variable paths', () => {
    const context = { foo: 'bar' };
    expect(compileTemplate('Value: ${  foo  }', context)).toBe('Value: bar');
  });
});

describe('resolvePath', () => {
  it('should resolve a simple path', () => {
    const context = { foo: 'bar' };
    expect(getProperty('foo', context)).toBe('bar');
  });

  it('should resolve a nested path', () => {
    const context = { a: { b: { c: 42 } } };
    expect(getProperty('a.b.c', context)).toBe(42);
  });

  it('should return undefined for missing path', () => {
    const context = { a: {} };
    expect(getProperty('a.b', context)).toBeUndefined();
  });

  it('should return the context itself for empty path', () => {
    const context = { x: 1 };
    expect(getProperty('', context)).toBeUndefined();
  });

  describe('setPath', () => {
    it('should set a simple property', () => {
      const obj: Record<string, unknown> = {};
      setObjectProperty(obj, 'foo', 123);
      expect(obj.foo).toBe(123);
    });

    it('should overwrite existing value at path', () => {
      const obj: Record<string, unknown> = { a: { b: 1 } };
      setObjectProperty(obj, 'a.b', 42);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj.a as any).b).toBe(42);
    });

    it('should create intermediate objects if they do not exist', () => {
      const obj: Record<string, unknown> = {};
      setObjectProperty(obj, 'x.y.z', true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj.x as any).y.z).toBe(true);
    });

    it('should handle setting property when intermediate is already an object', () => {
      const obj: Record<string, unknown> = { a: { b: {} } };
      setObjectProperty(obj, 'a.b.c', 'test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((obj.a as any).b as any).c).toBe('test');
    });
  });
});
