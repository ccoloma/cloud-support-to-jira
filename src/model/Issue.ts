/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

/** State enum. */
export enum State {
  STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
  NEW = 'NEW',
  IN_PROGRESS_GOOGLE_SUPPORT = 'IN_PROGRESS_GOOGLE_SUPPORT',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  SOLUTION_PROVIDED = 'SOLUTION_PROVIDED',
  CLOSED = 'CLOSED',
}

/** Priority enum. */
export enum Priority {
  PRIORITY_UNSPECIFIED = 'PRIORITY_UNSPECIFIED',
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

interface Actor {
  name?: string;
  email?: string;
  support?: boolean;
}

interface Classification {
  id: string;
  name: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  classification?: Classification;
  timeZone?: string;
  subscriberEmailAddresses?: string[];
  state: State;
  created: number;
  updated: number;
  creator?: Actor;
  contactEmail?: string;
  escalated?: boolean;
  testCase?: boolean;
  languageCode?: string;
  priority: Priority;
  [key: string]: unknown;
}
