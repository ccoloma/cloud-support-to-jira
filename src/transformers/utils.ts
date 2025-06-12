/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

/**
 * Resolves a template like "Hello ${issue.project.key}" using the given context.
 */
export function compileTemplate(template: string, params: Record<string, unknown>): string {
  return template.replace(/\${(.*?)}/g, (_, path) => {
    const value = getProperty(path.trim(), params);
    return value != null ? String(value) : '';
  });
}

/**
 * Resolves a path like "issue.project.key" from a context object.
 */
export function getProperty(propertyPath: string, context: Record<string, unknown>): unknown {
  return propertyPath.split('.').reduce((acc, part) => acc?.[part] as Record<string, unknown>, context);
}

/**
 * Set the value at a given path in an object.
 */
export function setObjectProperty(obj: Record<string, unknown>, propertyPath: string, propertyValue: unknown): void {
  const parts = propertyPath.split('.');
  const last = parts.pop()!;
  const target = parts.reduce<Record<string, unknown>>((acc, key) => {
    if (!(key in acc)) acc[key] = {};
    return acc[key] as Record<string, unknown>;
  }, obj);
  if (propertyValue === undefined) {
    delete target[last];
  } else {
    target[last] = propertyValue;
  }
}
