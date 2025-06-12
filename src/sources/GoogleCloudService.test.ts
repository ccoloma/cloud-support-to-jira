import { protos } from '@google-cloud/support';
import { Comment } from '../model/Comment';
import { Issue } from '../model/Issue';
import { GoogleCloudService, GoogleCloudServiceOptions } from './GoogleCloudService';

describe('GoogleCloudService', () => {
  const options: GoogleCloudServiceOptions = {
    keyFilename: 'fake-key.json',
    organizationId: 'fake-project',
  };

  let service: GoogleCloudService;

  beforeEach(() => {
    service = new GoogleCloudService(options);
  });

  describe('toIssueModel', () => {
    it('should convert an ICase to Issue model', () => {
      const raw: protos.google.cloud.support.v2.ICase = {
        name: 'projects/foo/cases/123456789',
        displayName: 'Test Issue',
        description: 'Test Description',
        state: 1,
        timeZone: 'Europe/Madrid',
        subscriberEmailAddresses: ['test@foo.com'],
        contactEmail: 'test@foo.com',
        escalated: true,
        testCase: false,
        languageCode: 'en',
        priority: 'P2',
        createTime: { seconds: 1000 },
        updateTime: { seconds: 2000 },
      };
      const model: Issue = service.toIssueModel(raw);
      expect(model.id).toBe(raw.name);
      expect(model.title).toBe(raw.displayName);
      expect(model.description).toBe(raw.description);
      expect(model.state).toBe(raw.state);
      expect(model.created).toBe(1000 * 1000);
      expect(model.updated).toBe(2000 * 1000);
    });
  });

  describe('toCommentModel', () => {
    it('should convert an IComment to Comment model', () => {
      const raw: protos.google.cloud.support.v2.IComment = {
        name: 'projects/foo/cases/123456789/comments/1',
        body: 'Test comment',
        createTime: { seconds: 1234 },
        creator: {
          displayName: 'Tester',
          email: 'tester@foo.com',
          googleSupport: true,
        },
      };
      const model: Comment = service.toCommentModel(raw);
      expect(model.id).toBe(raw.name);
      expect(model.body).toBe(raw.body);
      expect(model.created).toBe(1234 * 1000);
      expect(model.creator.name).toBe('Tester');
      expect(model.creator.email).toBe('tester@foo.com');
      expect(model.creator.support).toBe(true);
    });

    it('should fallback to plainTextBody if body is missing', () => {
      const raw: protos.google.cloud.support.v2.IComment = {
        name: 'projects/foo/cases/123456789/comments/2',
        plainTextBody: 'Plain text body',
        createTime: { seconds: 5678 },
        creator: {},
      };
      const model: Comment = service.toCommentModel(raw);
      expect(model.body).toBe('Plain text body');
    });

    it('should fallback to empty string if body and plainTextBody are missing', () => {
      const raw: protos.google.cloud.support.v2.IComment = {
        name: 'projects/foo/cases/123456789/comments/3',
        createTime: { seconds: 5678 },
      };
      const model: Comment = service.toCommentModel(raw);
      expect(model.body).toBe('');
    });
  });
});
