/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

let logTemplate = '[Issue Syncronizer] [SEVERITY] TIMESTAMP'; // default template

export function setLogTemplate(template: string) {
  logTemplate = template;
}

function logging(consoleFunction: (...data: unknown[]) => void, message: unknown, ...optionalParams: unknown[]) {
  const level = consoleFunction.name.toUpperCase();
  const date = new Date().toISOString();
  const prefix = logTemplate.replace('SEVERITY', level).replace('TIMESTAMP', date);
  if (optionalParams?.length > 0) {
    consoleFunction(`${prefix} ${message}`, ...optionalParams);
  } else {
    consoleFunction(prefix, message);
  }
}

export const log = {
  info: (message: unknown, ...optionalParams: unknown[]) => {
    logging(console.info, message, ...optionalParams);
  },
  error: (message: unknown, ...optionalParams: unknown[]) => {
    logging(console.error, message, ...optionalParams);
  },
  warn: (message: unknown, ...optionalParams: unknown[]) => {
    logging(console.warn, message, ...optionalParams);
  },
  debug: (message: unknown, ...optionalParams: unknown[]) => {
    if (process.env.DEBUG) {
      logging(console.debug, message, ...optionalParams);
    }
  },
};

export default log;
