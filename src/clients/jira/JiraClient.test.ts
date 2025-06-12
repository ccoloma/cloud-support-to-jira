import JiraClient from './JiraClient';

// Mock dependencies
jest.mock('../FetchAdapter', () => ({
  _delete: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

describe('JiraClient', () => {
  const options = {
    host: 'test.atlassian.net',
    username: 'user',
    password: 'token',
  };

  let client: JiraClient;

  beforeEach(() => {
    client = new JiraClient(options);
    jest.clearAllMocks();
  });

  describe('getDefaultRequestOptions', () => {
    it('should return headers with Authorization if username and password are provided', () => {
      const result = client.getDefaultRequestOptions();
      expect(result.headers).toHaveProperty('Authorization');
    });

    it('should throw error if strictSSL is true and username/password are missing', () => {
      const badClient = new JiraClient({ host: 'test', strictSSL: true });
      expect(() => badClient.getDefaultRequestOptions()).toThrow();
    });
  });

  describe('createUri', () => {
    it('should create a valid Jira API URI', () => {
      const uri = client.createUri('/issue/123', { foo: 'bar' });
      expect(uri).toContain('https://test.atlassian.net/rest/api/3/issue/123');
      expect(uri).toContain('foo=bar');
    });

    it('should use intermediatePath if provided', () => {
      const customClient = new JiraClient({ ...options, intermediatePath: '/custom/api' });
      const uri = customClient.createUri('/issue/123');
      expect(uri).toContain('/custom/api/issue/123');
    });
  });
});
