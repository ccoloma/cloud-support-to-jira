/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { JiraCommentResponse } from './JiraComment';

export interface JiraPage {
  maxResults: number;

  startAt: number;

  total: number;
}

export interface JiraCommentsPage extends JiraPage {
  comments: JiraCommentResponse[];
}
