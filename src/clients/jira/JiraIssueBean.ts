/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

export interface JiraIssueBean {
  changelog: {
    histories: object[];
    maxResults: number;
    startAt: number;
    total: number;
  };

  editmeta: {
    allowedValues: unknown[];

    autoCompleteUrl: string;

    configuration: object;

    defaultValue: unknown;

    hasDefaultValue: boolean;

    key: string;

    name: string;

    operations: string[];

    required: boolean;

    schema: object;
  };

  expand: string;

  fields: {
    [key: string]: unknown;

    updated: string;

    status: {
      description: string;
      iconUrl: string;
      name: string;
      id: string;
    };

    attachment: object[];

    comment: {
      comments: object[];

      maxResults: number;

      startAt: number;

      total: number;
    };
  };

  fieldsToInclude: {
    actuallyIncluded: string[];

    excluded: string[];

    included: string[];
  };

  id: string;

  key: string;

  names: object;

  operations: {
    linkGroups: object[];
  };

  properties: object;

  renderedFields: object;

  schema: object;

  self: string;

  transitions: {
    expand: string;

    fields: object;

    hasScreen: boolean;

    id: string;

    isAvailable: boolean;

    isConditional: boolean;

    isGlobal: boolean;

    isInitial: boolean;

    looped: boolean;

    name: string;

    to: {
      description: string;

      iconUrl: string;

      id: string;

      name: string;

      scope: {
        project: object;

        type: string;
      };

      self: string;

      statusCategory: {
        colorName: string;

        id: number;

        key: string;

        name: string;

        self: string;
      };
    };
  };

  versionedRepresentations: object;
}
