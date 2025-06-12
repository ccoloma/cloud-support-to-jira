/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { JiraIssueBean } from './JiraIssueBean';

export interface SearchAndReconcileResults {
  issues: JiraIssueBean[];
  names: object;
  nextPageToken: string | null;
  schema: {
    configuration: object;

    custom: string;

    customId: number;

    items: string;

    system: string;

    type: string;
  };
}
