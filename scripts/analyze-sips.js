const { Storage } = require('../src/storage');

async function analyzeSIPs() {
  const storage = new Storage();
  const data = await storage.getLatestScrape();
  
  // Group by status
  const byStatus = data.posts.reduce((acc, post) => {
    const status = post.status || 'untagged';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Group by month
  const byMonth = data.posts.reduce((acc, post) => {
    const month = new Date(post.d).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nSIP Status Distribution:', byStatus);
  console.log('\nSIP Timeline:', byMonth);
}

analyzeSIPs().catch(console.error); 