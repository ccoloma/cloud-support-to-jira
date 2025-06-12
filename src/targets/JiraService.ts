/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { Document } from 'adf-builder';
import { fromJiraADFDocument, toJiraADFParagraph } from '../clients/jira/JiraADF';
import JiraClient, { PaginationOptions } from '../clients/jira/JiraClient';
import { JiraCommentRequest, JiraCommentResponse } from '../clients/jira/JiraComment';
import { JiraIssue, JiraIssueFields } from '../clients/jira/JiraIssue';
import log from '../logging/log';
import { Comment } from '../model/Comment';
import { Priority, State } from '../model/Issue';
import { IssueRequest, TargetService } from './TargetService';

type IndexedJiraComments = Record<string, JiraCommentResponse>;

export interface JiraServiceOptions {
  host: string;
  username: string;
  apiToken: string;
  states?: Record<State, string>;
  priorities?: Record<Priority, string>;
}

const COMMENT_CLOUD_ID_PROPERTY_KEY = 'google-cloud-id';

export class JiraService extends TargetService<JiraIssueFields, JiraCommentResponse> {
  private jira: JiraClient;
  private options: Partial<JiraServiceOptions>;
  private transitionIdsByState: Record<State, string> = {} as Record<State, string>;

  constructor({ host, username, apiToken, ...options }: JiraServiceOptions) {
    super(options);
    this.options = options;
    this.jira = new JiraClient({
      host,
      username,
      password: apiToken,
    });
  }

  async createOrUpdateIssue({
    fields,
    sourceIssueKey,
    sourceUpdatedTime,
    state,
    priority,
  }: IssueRequest<JiraIssueFields>): Promise<string | undefined> {
    try {
      // check if the issue already exists in the target
      if (typeof fields.description == 'string') {
        fields.description = toJiraADFParagraph(fields.description);
      }
      if (fields.labels) {
        (fields.labels as unknown[]).push(sourceIssueKey);
      } else {
        fields.labels = [sourceIssueKey];
      }
      const jql = `labels = '${sourceIssueKey}'`;
      const results = await this.jira.searchJira(jql, { fields: [] });
      if (this.options.priorities) {
        fields.priority = {
          name: this.options.priorities[priority],
        };
      }
      const newJiraIssue: JiraIssue = { fields };
      log.debug('Jira issue constructed', JSON.stringify(newJiraIssue, null, 2));
      let result: string | undefined;
      let updateStatus = false;
      if (results?.issues?.length) {
        log.debug(`Issue with label ${sourceIssueKey} already exists.`);
        const jiraIssue = results.issues[0];
        log.debug(jiraIssue);
        if (sourceUpdatedTime > new Date(jiraIssue.fields.updated!).getTime()) {
          log.info('Updating issue...');
          await this.jira.updateIssue(jiraIssue.key, newJiraIssue, { returnIssue: true });
        }
        updateStatus = jiraIssue.fields.status?.id !== this.transitionIdsByState[state];
        result = jiraIssue.key;
      } else {
        log.info(`Issue with label ${sourceIssueKey} not found on JIRA. Creating issue`);
        const issue = await this.jira.addNewIssue(newJiraIssue);
        result = issue!.key;
        updateStatus = !!this.transitionIdsByState[state];
        log.info(`Issue created: key = ${result}`);
      }
      if (updateStatus) {
        await this.updateIssueState(result, state);
      }
      return result;
    } catch (error: unknown) {
      log.error(error);
      throw error;
    }
  }

  // transition are ignored on the issue endpoint, event if the doc says otherwise
  async updateIssueState(issueKey: string, state: State): Promise<void> {
    let transitionId: string | undefined = this.transitionIdsByState[state];
    if (!transitionId) {
      const transitions = await this.jira.getTransitions(issueKey);
      if (transitions) {
        Object.entries(this.options.states!).forEach(([s, jiraStateName]) => {
          const id = transitions.find((t) => t.name.toLowerCase() === jiraStateName.toLowerCase())?.id;
          if (id) {
            this.transitionIdsByState[s as State] = id;
          }
        });
      }
      transitionId = this.transitionIdsByState[state];
    }
    if (!transitionId) {
      log.warn(`Transition for state "${state}" not found. Please check your configuration.`);
      return;
    }
    log.info(`Updating issue status to ${state}`);
    await this.jira.updateIssueState(issueKey, transitionId);
  }

  async getComments(issueKey: string): Promise<IndexedJiraComments> {
    try {
      const comments: JiraCommentResponse[] = [];
      const baseOptions: PaginationOptions = {
        maxResults: 100,
        orderBy: 'created',
        expand: 'properties',
      };
      const commentsPage = await this.jira.getComments(issueKey, baseOptions);
      if (commentsPage) {
        comments.push(...commentsPage.comments);
        let startAt = commentsPage.startAt + commentsPage.maxResults;
        while (startAt < commentsPage.total) {
          const nextPage = await this.jira.getComments(issueKey, {
            ...baseOptions,
            startAt,
          });
          if (nextPage) {
            comments.push(...nextPage.comments);
            startAt += nextPage.maxResults;
          } else {
            break;
          }
        }
      }
      log.debug(`Found ${comments.length} comments for issue ${issueKey}.`);
      const indexedComments: IndexedJiraComments = {};
      comments.forEach((comment) => {
        const googleCloudIdAsAdfDocument = comment.properties?.find(
          (p) => p.key === COMMENT_CLOUD_ID_PROPERTY_KEY,
        )?.value;
        if (googleCloudIdAsAdfDocument) {
          const googleCloudId = fromJiraADFDocument(googleCloudIdAsAdfDocument);
          if (googleCloudId) {
            indexedComments[googleCloudId] = comment;
          }
        }
      });
      return indexedComments;
    } catch (error: unknown) {
      log.error(error);
      throw error;
    }
  }

  fromCommentModel(comment: Comment): Partial<JiraCommentResponse> {
    const properties = [
      {
        key: 'author',
        value: toJiraADFParagraph(`${comment.creator.name} (${comment.creator.email})`),
      },
      {
        key: COMMENT_CLOUD_ID_PROPERTY_KEY,
        value: toJiraADFParagraph(comment.id),
      },
    ];
    if (comment.creator.support) {
      properties.push({
        key: 'support',
        value: toJiraADFParagraph('true'),
      });
    }
    const body = new Document();
    const date = new Date(comment.created);
    body.paragraph().text(`${comment.creator.name}${comment.creator.support ? ' (Support account)' : ''} wrote: `);
    body.blockQuote().paragraph().text(comment.body);
    body.paragraph().em(`Original comment posted on ${date.toISOString()}`);
    return {
      id: comment.id,
      created: new Date(comment.created).toISOString(),
      body: body.toJSON(),
      properties,
    };
  }

  async createComment(comment: JiraCommentRequest, issueKey: string): Promise<JiraCommentResponse | undefined> {
    try {
      log.debug(`Creating comment for issue ${issueKey}.`);
      return this.jira.addComment(issueKey, comment);
    } catch (error: unknown) {
      log.error(error);
      throw error;
    }
  }

  async updateComment(
    comment: JiraCommentRequest,
    issueKey: string,
    commentKey: string,
  ): Promise<JiraCommentResponse | undefined> {
    try {
      log.debug(`Updating comment ${commentKey} of issue ${issueKey}.`);
      return this.jira.updateComment(issueKey, commentKey, comment);
    } catch (error: unknown) {
      log.error(error);
      throw error;
    }
  }
}
