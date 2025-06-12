/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import { File, Storage } from '@google-cloud/storage';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import yaml from 'yaml';
import log from '../logging/log';
import { GoogleCloudServiceOptions } from '../sources/GoogleCloudService';

interface SyncState {
  lastSyncedAt: string;
}

const firstSyncState: SyncState = {
  lastSyncedAt: '2020-01-01T00:00:00Z',
};

export class SyncStateManager {
  private useGcs: boolean;
  private gcsFile?: File;

  constructor(options: GoogleCloudServiceOptions) {
    const stateFileUrl = process.env.STATE_FILE_URL;
    if (stateFileUrl) {
      log.debug(`Using GCS for sync state: ${stateFileUrl}`);
      if (!stateFileUrl?.startsWith('gs://') && !stateFileUrl?.startsWith('https://')) {
        throw new Error('STATE_FILE_URL must start with gs:// or https://');
      }
      const url = new URL(stateFileUrl.replace('gs://', 'https://'));
      const gcsBucket = url.hostname;
      const gcsPath = url.pathname.slice(1); // remove "/"
      const storage = new Storage(options);
      this.gcsFile = storage.bucket(gcsBucket).file(gcsPath);
      this.useGcs = true;
    } else {
      log.debug('Using local file for sync state');
      this.useGcs = false;
    }
  }

  private getLocalFilePath(): string {
    return path.resolve(process.cwd(), 'state.yaml');
  }

  async load(): Promise<SyncState> {
    log.info('Loading sync state');
    let state: SyncState | undefined = undefined;
    try {
      if (this.useGcs) {
        const [file] = await this.gcsFile!.download();
        state = yaml.parse(file.toString()) as SyncState;
      } else {
        const file = await fs.readFile(this.getLocalFilePath(), 'utf-8');
        state = yaml.parse(file) as SyncState;
      }
      if (!state || !state.lastSyncedAt) {
        log.warn('Sync state is empty or invalid, using default state');
        return firstSyncState;
      }
      return state || firstSyncState;
    } catch {
      return { lastSyncedAt: '2020-01-01T00:00:00Z' };
    }
  }

  async save(state: SyncState): Promise<void> {
    const yamlData = yaml.stringify(state);
    log.info('Saving sync state.');
    if (this.useGcs) {
      await this.gcsFile!.save(yamlData, {
        resumable: false,
        contentType: 'application/x-yaml',
      });
    } else {
      await fs.writeFile(this.getLocalFilePath(), yamlData, 'utf-8');
    }
    log.debug('Sync state saved:', state);
  }
}
