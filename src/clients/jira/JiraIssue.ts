/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { Typed } from 'adf-builder/dist/nodes';

export interface JiraIssueFields {
  project: {
    key: string;
  };
  summary: string;
  priority?: {
    name: string;
  };
  description?: string | Typed;
  issuetype: {
    name: string;
  };
  [key: string]: unknown; // for custom fields
}

export interface JiraIssue {
  fields: JiraIssueFields;
  properties?: {
    [key: string]: unknown;
  }[];
  transition?: {
    id: string;
  };
  update?: {
    [key: string]: unknown;
  };
}
