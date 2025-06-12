/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import 'source-map-support/register';
import YAML from 'yaml';
import log, { setLogTemplate } from './logging/log';
import { GoogleCloudService, GoogleCloudServiceOptions } from './sources/GoogleCloudService';
import { SourceService } from './sources/SourceService';
import { SyncStateManager } from './state/StateService';
import { JiraService, JiraServiceOptions } from './targets/JiraService';
import { TargetService } from './targets/TargetService';
import { toIssue, TransformerConfig } from './transformers/issues';

type SourceConfig = GoogleCloudServiceOptions;

interface Source {
  type: 'google-cloud';
  config: SourceConfig;
}

type TargetConfig = JiraServiceOptions;

interface Target {
  type: 'jira';
  config: TargetConfig;
}

interface Config extends TransformerConfig {
  source: Source;
  target: Target;
  logger?: string;
}

const sourceRegistry: { [K in Source['type']]: new (config: SourceConfig) => SourceService<unknown, unknown> } = {
  'google-cloud': GoogleCloudService,
};

const targetRegistry: { [K in Target['type']]: new (config: TargetConfig) => TargetService<unknown, unknown> } = {
  jira: JiraService,
};

// Load config.yaml
const configPath = process.env.CONFIG_PATH || path.join(__dirname, '..', 'config.yaml');
const file = fs.readFileSync(configPath, 'utf8');
const config: Config = YAML.parse(file);

if (config.logger) {
  setLogTemplate(config.logger);
}

// Inject secrets from env
if (config.target.type === 'jira') {
  config.target.config.username = process.env.JIRA_USERNAME!;
  config.target.config.apiToken = process.env.JIRA_API_TOKEN!;
}

const SourceClass = sourceRegistry[config.source.type];
const TargetClass = targetRegistry[config.target.type];

if (!SourceClass) throw new Error(`Unknown source type: ${config.source.type}`);
if (!TargetClass) throw new Error(`Unknown target type: ${config.target.type}`);

const source = new SourceClass(config.source.config);
const target = new TargetClass(config.target.config);

const stateManager = new SyncStateManager(config.source.config);
const state = stateManager.load();
async function sync(SYNC_LIMIT = 200) {
  log.info('Syncing GCP issues with Jira...');
  log.debug('Loading issues...');
  const lastState = await state;
  const iterator = source.getIssues(new Date(lastState.lastSyncedAt));
  let count = 0;
  for await (const sourceIssue of iterator) {
    try {
      const issue = source.toIssueModel(sourceIssue);
      log.info('Syncing issue', issue.id);
      log.debug(issue);
      const transformedIssue = toIssue(issue, config);
      log.debug('Transformed Issue:', JSON.stringify(transformedIssue));
      const jiraIssueKey = await target.createOrUpdateIssue({
        fields: transformedIssue,
        sourceIssueKey: issue.id,
        sourceUpdatedTime: issue.updated,
        state: issue.state,
        priority: issue.priority,
      });

      // start syncing the comments
      log.info('Loading comments for issue', issue.id!);
      const comments = source.getComments(issue.id);
      const indexedJiraComments = await target.getComments(jiraIssueKey!);
      log.debug('Indexed Jira Comments:', JSON.stringify(indexedJiraComments));
      for await (const issueComment of comments) {
        const comment = source.toCommentModel(issueComment);
        log.info('Syncing comment', comment.id);
        log.debug('Comment:', JSON.stringify(comment));
        const transformedComment = target.fromCommentModel(comment);
        log.debug('Transformed Comment:', JSON.stringify(transformedComment));
        const jiraComment = indexedJiraComments[comment.id];
        // Google Cloud comments cannot be updated seeing its API, so we don't need to update them
        if (!jiraComment) {
          await target.createComment(transformedComment, jiraIssueKey!);
        } else {
          log.debug('Jira Comment already exists. Skipping...');
        }
      }
      count++;
    } catch (error: unknown) {
      log.error(`Skipping issue due to error: ${error}`);
    }
    if (count > SYNC_LIMIT) {
      log.info(`Limit of ${SYNC_LIMIT} issues reached. Stopping sync.`);
      break;
    }
  }
  await stateManager.save({
    lastSyncedAt: new Date().toISOString(),
  });
}

if (require.main === module) {
  sync(process.env.SYNC_LIMIT ? +process.env.SYNC_LIMIT : undefined);
}
