const nock = require('nock');

const mockForumResponses = {
  latestPage: {
    topic_list: {
      topics: [
        {
          id: 1,
          title: '[SIP-001] Test Proposal',
          slug: 'sip-001-test-proposal',
          created_at: '2024-02-20T10:00:00Z'
        },
        {
          id: 2,
          title: 'Regular Post',
          slug: 'regular-post',
          created_at: '2024-02-20T11:00:00Z'
        },
        {
          id: 3,
          title: '[SIP-002] Another Test',
          slug: 'sip-002-another-test',
          created_at: '2024-02-20T12:00:00Z'
        }
      ],
      more_topics_url: null
    }
  },
  
  topicContent: {
    post_stream: {
      posts: [{
        cooked: '<p>This is the content of a SIP</p>',
        raw: 'This is the content of a SIP'
      }]
    }
  }
};

function setupMockForum() {
  // Clear any existing interceptors
  nock.cleanAll();
  
  // Mock the forum API endpoints
  const scope = nock('https://forum.rare.xyz')
    .persist()
    .get('/latest.json')
    .query(true)
    .reply(200, mockForumResponses.latestPage)
    .get(/\/t\/\d+\.json/)
    .reply(200, mockForumResponses.topicContent);

  // Mock the failing endpoint test
  nock('https://forum.rare.xyz')
    .get('/failing-endpoint')
    .times(2)
    .reply(500)
    .get('/failing-endpoint')
    .reply(200, { success: true });

  // Mock the always failing endpoint
  nock('https://forum.rare.xyz')
    .get('/always-fails')
    .times(3)
    .reply(500);

  return scope;
}

module.exports = {
  mockForumResponses,
  setupMockForum
}; 