import { toIssue, TransformerConfig } from './issues';
// Import jest globals for type recognition

describe('toIssue', () => {
  it('maps string fields using resolveTemplate', () => {
    const issue = { id: '123', subject: 'Test subject' };
    const config: TransformerConfig = {
      mapping: {
        summary: '${subject}',
        ticketId: '${id}',
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      summary: 'Test subject',
      ticketId: '123',
    });
  });

  it('maps nested fields using resolveTemplate', () => {
    const issue = { email: { id: '123', subject: 'Test subject' } };
    const config: TransformerConfig = {
      mapping: {
        summary: '${email.subject}',
        ticketId: '${email.id}',
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      summary: 'Test subject',
      ticketId: '123',
    });
  });

  it('can config nested fields on transformer config', () => {
    const issue = { id: '123', subject: 'Test subject' };
    const config: TransformerConfig = {
      mapping: {
        summary: {
          subject: '${subject}',
          id: '${id}',
        },
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      summary: {
        subject: 'Test subject',
        id: '123',
      },
    });
  });

  it('maps array fields using resolveTemplate', () => {
    const issue = { tags: ['bug', 'urgent'] };
    const config: TransformerConfig = {
      mapping: {
        labels: ['${tags.0}', '${tags.1}'],
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      labels: ['bug', 'urgent'],
    });
  });

  it('maps array of object fields using resolveTemplate', () => {
    const issue = { id: '1', text: 'bar' };
    const config: TransformerConfig = {
      mapping: {
        foo: [
          {
            id: '${id}',
            text: '${text}',
          },
        ],
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      foo: [
        {
          id: '1',
          text: 'bar',
        },
      ],
    });
  });

  it('applies override rules', () => {
    const issue = { id: '456', subject: 'Override test' };
    const config: TransformerConfig = {
      mapping: {
        summary: '${subject}',
      },
      rules: {
        override: {
          summary: 'Overridden summary',
          tags: ['override1', 'override2'],
        },
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      summary: 'Overridden summary',
      tags: ['override1', 'override2'],
    });
  });

  it('removes ignored fields', () => {
    const issue = { id: '789', subject: 'Ignore test' };
    const config: TransformerConfig = {
      mapping: {
        summary: '${subject}',
        ticketId: '${id}',
      },
      rules: {
        ignore: ['ticketId'],
      },
    };

    const result = toIssue(issue, config);

    expect(result).toMatchObject({
      summary: 'Ignore test',
    });
  });
});
