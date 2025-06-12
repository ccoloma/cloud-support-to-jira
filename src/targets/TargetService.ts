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
import { Priority, State } from '../model/Issue';

export interface IssueRequest<ServiceModelIssue> {
  fields: ServiceModelIssue;
  sourceIssueKey: string;
  sourceUpdatedTime: number;
  state: State;
  priority: Priority;
}

export abstract class TargetService<ServiceModelIssue, ServiceModelComment> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config: {
    [key: string]: unknown;
    states?: Record<State, string>;
    priorities?: Record<Priority, string>;
  }) {}
  abstract createOrUpdateIssue(request: IssueRequest<ServiceModelIssue>): Promise<string | undefined>;
  abstract getComments(issueKey: string): Promise<Record<string, ServiceModelComment>>;
  abstract createComment(comment: object, issueKey: string): Promise<ServiceModelComment | undefined>;
  abstract updateComment(
    comment: object,
    issueKey: string,
    commentKey: string,
  ): Promise<ServiceModelComment | undefined>;
  abstract fromCommentModel(comment: Comment): Partial<ServiceModelComment>;
}
