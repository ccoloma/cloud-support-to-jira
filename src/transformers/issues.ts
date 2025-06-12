/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { compileTemplate, setObjectProperty } from './utils';

interface RulesConfig {
  ignore?: string[];
  override?: {
    [key: string]: string | string[];
  };
}

export interface TransformerConfig {
  mapping: {
    [field: string]: unknown;
  };
  rules?: RulesConfig;
}

export function toIssue(issue: { [key: string]: unknown }, config: TransformerConfig): Record<string, unknown> {
  const { mapping } = config;

  const newIssue: Record<string, unknown> = {};

  const context = { ...issue }; // We'll support resolving ${xxx}, not ${issue.xxx}

  function mapValue(mappingField: string, mappingValue: unknown, object: Record<string, unknown> = newIssue) {
    if (Array.isArray(mappingValue)) {
      setObjectProperty(object, mappingField, []);
      mappingValue.forEach((entry, index) => {
        if (typeof entry === 'string') {
          (object[mappingField] as string[]).push(compileTemplate(entry, context)); // Push the resolved string,
        } else if (typeof entry === 'number' || typeof entry === 'boolean') {
          (object[mappingField] as (number | boolean)[]).push(entry); // Push the value directly
        } else if (typeof entry === 'object' && entry !== null) {
          (object[mappingField] as Record<string, unknown>[]).push({}); // Create an empty object for each entry
          for (const [nestedField, nestedValue] of Object.entries(entry)) {
            mapValue(nestedField, nestedValue, (object[mappingField] as Record<string, unknown>[])[index]);
          }
        }
      });
    } else if (typeof mappingValue === 'string') {
      return setObjectProperty(object, mappingField, compileTemplate(mappingValue, context));
    } else if (typeof mappingValue === 'number' || typeof mappingValue === 'boolean') {
      setObjectProperty(object, mappingField, mappingValue);
    } else if (typeof mappingValue === 'object' && mappingValue !== null) {
      setObjectProperty(object, mappingField, {});
      for (const [nestedField, nestedValue] of Object.entries(mappingValue)) {
        mapValue(nestedField, nestedValue, object[mappingField] as Record<string, unknown>);
      }
    }
  }

  for (const [field, value] of Object.entries(mapping)) {
    mapValue(field, value);
  }

  if (config.rules?.ignore) {
    for (const ignore in config.rules.ignore) {
      if (Object.prototype.hasOwnProperty.call(config.rules.ignore, ignore)) {
        const path = config.rules.ignore[ignore];
        setObjectProperty(newIssue, path, undefined); // Remove ignored fields
      }
    }
  }

  if (config.rules?.override) {
    for (const [path, override] of Object.entries(config.rules.override)) {
      if (Array.isArray(override)) {
        setObjectProperty(
          newIssue,
          path,
          override.map((entry) => compileTemplate(entry, context)),
        );
      } else {
        const resolved = compileTemplate(override, context);
        setObjectProperty(newIssue, path, resolved);
      }
    }
  }

  return newIssue;
}
