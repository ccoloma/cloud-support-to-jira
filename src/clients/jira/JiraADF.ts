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
import { Typed } from 'adf-builder/dist/nodes';
import log from '../../logging/log';

export function doc(...content: Typed[]): Typed {
  return {
    type: 'doc',
    version: 1,
    content,
  };
}

export function toJiraADFParagraph(text: string): Typed {
  return doc(new Document().paragraph().text(text).toJSON());
}

export function fromJiraADFDocument(document?: Typed): string | undefined {
  if (!document) {
    return undefined;
  }
  log.debug('fromJiraADFDocument', document);
  let content: Typed = document!.content;
  let text: string | undefined = undefined;
  while (true) {
    if (content && content.length > 0) {
      const node = content[0];
      if (node.type === 'text') {
        text = node.text as string;
        break;
      }
      content = node.content;
    } else {
      break;
    }
  }
  return text;
}
