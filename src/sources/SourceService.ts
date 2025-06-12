/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { Comment } from '../model/Comment';
import { Issue } from '../model/Issue';

export abstract class SourceService<SourceIssue, SourceComment> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config: object) {}
  abstract toIssueModel(issue: SourceIssue): Issue;
  abstract toCommentModel(comment: SourceComment): Comment;
  abstract getIssues(lastSyncedAt: Date): AsyncIterable<SourceIssue>;
  abstract getComments(issueKey: string): AsyncIterable<SourceComment>;
}
