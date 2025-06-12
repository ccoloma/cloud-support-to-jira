/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { protos, v2 } from '@google-cloud/support';
import log from '../logging/log';
import { Comment } from '../model/Comment';
import { Issue, Priority, State } from '../model/Issue';
import { SourceService } from './SourceService';

const { CaseServiceClient } = v2;

export interface GoogleCloudServiceOptions {
  keyFilename: string;
  organizationId: string;
}

const now = new Date();
const earlier = new Date(now.getTime() - 1000 * 60 * 60 * 24);
const projectIssue: protos.google.cloud.support.v2.ICase = {
  name: 'projects/foo/cases/123456789',
  displayName: 'Project issue',
  description: 'Description of project issue',
  state: State.NEW,
  timeZone: 'Europe/Madrid',
  subscriberEmailAddresses: [],
  contactEmail: 'foo@bar.baz',
  escalated: false,
  testCase: false,
  languageCode: 'es',
  priority: Priority.P1,
  createTime: { seconds: Math.floor(earlier.getTime() / 1000) },
  updateTime: { seconds: Math.floor(now.getTime() / 1000) },
  classification: {
    id: 'billing',
    displayName: 'Billing Issue',
  },
};
const organizationIssue: protos.google.cloud.support.v2.ICase = {
  name: 'organizations/123/cases/123456789',
  displayName: 'Organization issue',
  description: 'Description of an organization issue',
  state: State.NEW,
  timeZone: 'Europe/Madrid',
  subscriberEmailAddresses: [],
  contactEmail: 'foo@bar.baz',
  escalated: false,
  testCase: false,
  languageCode: 'es',
  priority: Priority.P3,
  createTime: { seconds: Math.floor(earlier.getTime() / 1000) },
  updateTime: { seconds: Math.floor(now.getTime() / 1000) },
  classification: {
    id: 'billing',
    displayName: 'Billing Issue',
  },
};
const counter = 1;

export class GoogleCloudService extends SourceService<
  protos.google.cloud.support.v2.ICase,
  protos.google.cloud.support.v2.IComment
> {
  private client;
  private organizationId: string;

  constructor(private options: GoogleCloudServiceOptions) {
    // Inicializa el cliente de la API de Cloud Support
    super(options);
    this.organizationId = options.organizationId;
    this.client = new CaseServiceClient({
      keyFilename: this.options.keyFilename,
    });
  }

  async _getIssues(lastSyncedAt: Date) {
    try {
      const iterable = this.client.searchCasesAsync({
        parent: this.organizationId,
        query: `updateTime>"${lastSyncedAt.toISOString()}"`,
      });
      return iterable;
    } catch (error) {
      log.error('Error reading cases list:', error);
    }
  }

  async _getComments(issueName: string) {
    try {
      const iterable = this.client.matchCommentFromProjectCaseCommentName(issueName);
      return iterable;
    } catch (error) {
      log.error('Error reading cases list:', error);
    }
  }

  toIssueModel(issue: protos.google.cloud.support.v2.ICase): Issue {
    return {
      id: issue.name!,
      title: issue.displayName!,
      description: issue.description || undefined,
      state: issue.state as State,
      timeZone: issue.timeZone || undefined,
      subscriberEmailAddresses: issue.subscriberEmailAddresses || [],
      contactEmail: issue.contactEmail || undefined,
      escalated: issue.escalated || false,
      testCase: issue.testCase || false,
      languageCode: issue.languageCode || undefined,
      priority: issue.priority as Priority,
      created: new Date((issue.createTime!.seconds! as number) * 1000).getTime(),
      updated: new Date((issue.updateTime!.seconds! as number) * 1000).getTime(),
    };
  }

  toCommentModel(comment: protos.google.cloud.support.v2.IComment): Comment {
    return {
      id: comment.name!,
      body: comment.body || comment.plainTextBody || '',
      created: new Date((comment.createTime!.seconds! as number) * 1000).getTime(),
      creator: {
        name: comment.creator?.displayName || '',
        email: comment.creator?.email || '',
        support: comment.creator?.googleSupport || false,
      },
    };
  }

  getIssues(): AsyncIterable<protos.google.cloud.support.v2.ICase> {
    if (counter > 0) {
      projectIssue.displayName = `Project issue update ${counter}`;
      projectIssue.description = `Description of project issue update ${counter}`;
      organizationIssue.displayName = `Organization issue update ${counter}`;
      organizationIssue.description = `Description of organization issue update ${counter}`;
      if (counter % 2 === 0) {
        projectIssue.state = State.ACTION_REQUIRED;
        organizationIssue.state = State.SOLUTION_PROVIDED;
      } else {
        projectIssue.state = State.IN_PROGRESS_GOOGLE_SUPPORT;
        organizationIssue.state = State.IN_PROGRESS_GOOGLE_SUPPORT;
      }
    }
    const cases: protos.google.cloud.support.v2.ICase[] = [
      projectIssue,
      organizationIssue,
      /**
     * 
    {
      name: 'organizations/bar/cases/987654321',
      displayName: 'Issue 2',
      description: 'Description of issue 2',
      state: protos.google.cloud.support.v2.Case.State.CLOSED,
      timeZone: 'Europe/Madrid',
      subscriberEmailAddresses: ['foo@bar.baz'],
      contactEmail: 'admin@bar.baz',
      escalated: false,
      testCase: false,
      languageCode: 'es',
      priority: 'P4',
      createTime: { seconds: Math.floor(earlier.getTime() / 1000) },
      updateTime: { seconds: Math.floor(now.getTime() / 1000) },
    },
    */
    ];
    return {
      [Symbol.asyncIterator](): AsyncIterator<protos.google.cloud.support.v2.ICase> {
        let index = 0;
        return {
          async next(): Promise<IteratorResult<protos.google.cloud.support.v2.ICase>> {
            if (index < cases.length) {
              return { value: cases[index++], done: false };
            } else {
              return { value: undefined, done: true };
            }
          },
        };
      },
    };
  }

  getComments(issueName: string) {
    const Comments: protos.google.cloud.support.v2.IComment[] = [
      {
        name: issueName + '/comments/123456789',
        createTime: { seconds: Math.floor(earlier.getTime() / 1000) },
        body: 'How do you throw a ball?',
        creator: {
          displayName: 'Robin',
          email: 'robin@bar.com',
        },
      },
      {
        name: issueName + '/comments/987654321',
        createTime: { seconds: Math.floor(earlier.getTime() / 1000) },
        plainTextBody: 'I am the best',
        body: 'Try to think about it',
        creator: {
          displayName: 'Batman',
          email: 'batman@google.com',
          googleSupport: true,
        },
      },
    ];
    return {
      [Symbol.asyncIterator](): AsyncIterator<protos.google.cloud.support.v2.IComment> {
        let index = 0;
        return {
          async next(): Promise<IteratorResult<protos.google.cloud.support.v2.IComment>> {
            if (index < Comments.length) {
              return { value: Comments[index++], done: false };
            } else {
              return { value: undefined, done: true };
            }
          },
        };
      },
    };
  }
}
