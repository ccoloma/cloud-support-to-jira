import { Typed } from 'adf-builder/dist/nodes';
import { doc, fromJiraADFDocument, toJiraADFParagraph } from './JiraADF';

describe('JiraADF', () => {
  describe('doc', () => {
    it('should create a doc node with given content', () => {
      const content: Typed = { type: 'paragraph', content: [] };
      const result = doc(content);
      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [content],
      });
    });
  });

  describe('toJiraADFParagraph', () => {
    it('should create a Jira ADF doc with a paragraph containing the text', () => {
      const text = 'Hello, Jira!';
      const result = toJiraADFParagraph(text);
      expect(result.type).toBe('doc');
      expect(result.version).toBe(1);
      expect(Array.isArray(result.content)).toBe(true);
      const paragraph = result.content[0];
      expect(paragraph.type).toBe('paragraph');
      expect(Array.isArray(paragraph.content)).toBe(true);
      expect(paragraph.content[0].type).toBe('text');
      expect(paragraph.content[0].text).toBe(text);
    });
  });

  describe('fromJiraADFDocument', () => {
    it('should return undefined if document is undefined', () => {
      expect(fromJiraADFDocument(undefined)).toBeUndefined();
    });

    it('should extract text from a simple Jira ADF document', () => {
      const text = 'Extract me!';
      const adfDoc: Typed = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text,
              },
            ],
          },
        ],
      };
      expect(fromJiraADFDocument(adfDoc)).toBe(text);
    });

    it('should return undefined if no text node is found', () => {
      const adfDoc: Typed = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      };
      expect(fromJiraADFDocument(adfDoc)).toBeUndefined();
    });
  });
});
