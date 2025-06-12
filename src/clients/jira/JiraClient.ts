/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { ParsedUrlQueryInput } from 'querystring';
import url from 'url';
import log from '../../logging/log';
import { _delete, get, OptionsWithoutMethod, post, put } from '../FetchAdapter';
import { JiraCommentRequest, JiraCommentResponse } from './JiraComment';
import { JiraIssue } from './JiraIssue';
import { JiraCommentsPage } from './JiraPage';
import { JiraTransition } from './JiraTransition';
import { SearchAndReconcileResults } from './SearchAndReconcileResults';

// based on jira-client

interface JiraClientOptions {
  /* What protocol to use to connect to. Default is https */
  protocol?: 'http' | 'https';
  /* What host is this tool connecting to for the jira instance? Ex: myhost.atlassian.com */
  host: string;
  /* What port is this tool connecting to jira with? Only needed for none standard ports. Ex: 8080, 3000, etc */
  port?: number;
  /* Specify a username for this tool to authenticate all requests with. Ex: myuser@mydomain.com */
  username?: string;
  /* Specify a password for this tool to authenticate all requests with. Cloud users need to generate an [API token](https://confluence.atlassian.com/cloud/api-tokens-938839638.html) for this value. */
  password?: string;
  /* What other url parts exist, if any, before the rest/api/ section? */
  base?: string;
  /* If specified, overwrites the default rest/api/version section of the uri */
  intermediatePath?: string;
  /* Does this tool require each request to be authenticated?  Defaults to true. */
  strictSSL?: boolean;
}

const defaultRequestOptions: Partial<JiraClientOptions> = {
  protocol: 'https',
  strictSSL: true,
  base: '',
};

interface SearchJiraOptions {
  /** The token for a page to fetch that is not the first page */
  nextPageToken?: string;
  /** The maximum number of items to return per page. Max 5000. Default 50 */
  maxResults?: number;
  /** A list of fields to return for each issue. Use it to retrieve a subset of fields. Options include:
   * - '*all' to return all fields
   * - '*navigable' to return navigable fields
   * - 'id' to return only issue IDs
   * - An issue field, prefixed with  a dash to exclude
   */
  fields?: (string | '*all' | '*navigable' | 'id')[];
  /**
   * Use expand to include additional information about issues in the response. Note that, unlike the majority of instances where expand is specified, expand is defined as a comma-delimited string of values.
   */
  expand?:
    | 'names'
    | 'schema'
    | 'transitions'
    | 'operations'
    | 'editmeta'
    | 'changelog'
    | 'renderedFields'
    | 'versionedRepresentations'[];
  /** A list of up to 5 issue properties to include in the results. This parameter accepts a comma-separated list. */
  properties?: string[];
  /** Reference fields by their key (rather than ID). The default is false */
  fieldsByKeys?: boolean;
  /** Strong consistency issue ids to be reconciled with search results. Accepts max 50 ids */
  reconcileIssues?: number[];
}

interface JiraQueryOptions {
  notifyUsers?: boolean;
  overrideEditableFlag?: boolean;
  expand?: string;
}

interface IssueUpdateQueryOptions extends JiraQueryOptions {
  overrideScreenSecurity?: boolean;
  returnIssue?: boolean;
}

export interface PaginationOptions {
  startAt?: number;
  maxResults?: number;
  orderBy?: 'created' | '-created' | '+created';
  expand?: string;
}

/**
 * Wrapper for the JIRA Rest Api
 * https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro
 */
export default class JiraClient {
  options: JiraClientOptions;

  constructor(options: JiraClientOptions) {
    this.options = { ...defaultRequestOptions, ...options };
  }

  /**
   * Get default options for all requests
   */
  getDefaultRequestOptions(): Partial<OptionsWithoutMethod> {
    if (this.options.strictSSL && (!this.options.username || !this.options.password)) {
      throw new Error('Jira username and API token are required for authentication');
    }
    return {
      headers:
        this.options.username && this.options.password
          ? {
              Authorization: `Basic ${Buffer.from(`${this.options.username}:${this.options.password}`).toString(
                'base64',
              )}`,
            }
          : {},
    };
  }

  /**
   * Creates a URI object for a given pathname
   */
  createUri(pathname: string, queryParams: object = {}): string {
    const tempPath = this.options.intermediatePath || `/rest/api/3`;
    const uri = url.format({
      protocol: this.options.protocol,
      hostname: this.options.host,
      port: this.options.port,
      pathname: `${this.options.base}${tempPath}${pathname}`,
      query: queryParams as ParsedUrlQueryInput,
    });
    return decodeURIComponent(uri);
  }

  /**
   * Remove the attachment
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-attachment-id-delete)
   * @param attachmentId - the attachment id
   */
  deleteAttachment(attachmentId: string): Promise<void> {
    return _delete(this.createUri(`/attachment/${attachmentId}`), {
      ...this.getDefaultRequestOptions(),
    });
  }

  /**
   * Pass a search query to Jira
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post)
   */
  searchJira(jql: string, options: SearchJiraOptions = {}): Promise<SearchAndReconcileResults | undefined> {
    return post(
      this.createUri('/search/jql'),
      {
        ...options,
        jql,
      },
      this.getDefaultRequestOptions(),
    );
  }

  /**
   * Add issue to Jira
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post)
   */
  addNewIssue(issue: JiraIssue): Promise<
    | {
        id: string;

        key: string;
      }
    | undefined
  > {
    return post(this.createUri('/issue'), issue, this.getDefaultRequestOptions());
  }

  /**
   * Update issue in Jira
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put)
   */
  updateIssue(
    issueId: string,
    issue: JiraIssue,
    updateOptions: IssueUpdateQueryOptions = { returnIssue: true },
  ): Promise<JiraIssue | undefined> {
    return put(this.createUri(`/issue/${issueId}`, updateOptions), issue, this.getDefaultRequestOptions());
  }

  /**
   * Add a comment to an issue
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/#api-rest-api-3-issue-issueidorkey-comment-post)
   */
  addComment(issueId: string, comment: JiraCommentRequest): Promise<JiraCommentResponse | undefined> {
    return post(this.createUri(`/issue/${issueId}/comment`), comment, this.getDefaultRequestOptions());
  }

  /**
   * Update comment for an issue
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/#api-rest-api-3-issue-issueidorkey-comment-id-put)
   */
  updateComment(
    issueId: string,
    commentId: string,
    comment: JiraCommentRequest,
    options: JiraQueryOptions = {},
  ): Promise<JiraCommentResponse | undefined> {
    return put(
      this.createUri(`/issue/${issueId}/comment/${commentId}`, options),
      comment,
      this.getDefaultRequestOptions(),
    );
  }

  /**
   * Get Comments by IssueId.
   * [Jira Doc](hhttps://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/#api-rest-api-3-issue-issueidorkey-comment-get)
   */
  getComments(issueId: string, options: PaginationOptions = {}): Promise<JiraCommentsPage | undefined> {
    return get(this.createUri(`/issue/${issueId}/comment`, options), this.getDefaultRequestOptions());
  }

  /**
   * Performs an issue transition and, if the transition has a screen, updates the fields from the transition screen.
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-post)
   */
  updateIssueState(issueId: string, stateId: string): Promise<void> {
    return post(
      this.createUri(`/issue/${issueId}/transitions`),
      {
        transition: {
          id: stateId,
        },
      },
      this.getDefaultRequestOptions(),
    );
  }

  /**
   * Returns either all transitions or a transition that can be performed by the user on an issue, based on the issue's status.
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-get)
   */
  async getTransitions(issueId: string): Promise<JiraTransition[]> {
    const response: { transitions: JiraTransition[] } | undefined = await get(
      this.createUri(`/issue/${issueId}/transitions`),
      this.getDefaultRequestOptions(),
    );
    if (!response) {
      return [];
    }
    log.debug('Transitions fetched from Jira:', JSON.stringify(response, null, 2));
    return response.transitions;
  }
}
