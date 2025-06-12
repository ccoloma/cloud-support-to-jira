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

export interface JiraCommentRequest {
  body: Typed;
  properties?: {
    key: string;
    value: Typed | null | undefined;
  }[];
}

export interface JiraCommentResponse extends JiraCommentRequest {
  id: string;
  renderedBody: string;
  created: string;
  updated: string;
  jsdAuthorCanSeeRequest: boolean;
  jsdPublic: boolean;
}
