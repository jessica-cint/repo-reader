// Simple Slack Bot Example using Repository Analysis Data
// This example shows how to use the generated JSON data in a Slack bot

const fs = require('fs');

// Load the analysis data
const analysisData = JSON.parse(fs.readFileSync('./lucidhq-complete.json', 'utf8'));

// Example Slack bot responses
function handleRepoQuery(repoName) {
  const repo = analysisData.repositories.find(r => 
    r.name.toLowerCase().includes(repoName.toLowerCase())
  );
  
  if (!repo) {
    return `❌ Repository "${repoName}" not found in ${analysisData.organization}`;
  }
  
  return `📂 **${repo.name}**
🌟 Stars: ${repo.stargazersCount || 0}
🍴 Forks: ${repo.forksCount || 0}
💻 Language: ${repo.language || 'N/A'}
📝 Description: ${repo.description || 'No description'}
🏷️ Topics: ${repo.topics?.join(', ') || 'None'}
📅 Last updated: ${new Date(repo.updatedAt).toLocaleDateString()}`;
}

function getOrgStats() {
  return `📊 **${analysisData.organization} Organization Stats**
📦 Total repositories: ${analysisData.totalRepositories.toLocaleString()}
🔓 Public: ${analysisData.publicRepositories}
🔒 Private: ${analysisData.privateRepositories}
🌟 Total stars: ${analysisData.totalStars || 0}
🍴 Total forks: ${analysisData.totalForks || 0}
💻 Top languages: ${Object.keys(analysisData.languages).slice(0, 5).join(', ')}
🏷️ Popular topics: ${Object.keys(analysisData.topics).slice(0, 5).join(', ')}`;
}

function findReposByTopic(topic) {
  const repos = analysisData.repositories.filter(r => 
    r.topics?.some(t => t.toLowerCase().includes(topic.toLowerCase()))
  );
  
  if (repos.length === 0) {
    return `❌ No repositories found with topic "${topic}"`;
  }
  
  const repoList = repos.slice(0, 10).map(r => `• ${r.name}`).join('\n');
  return `📂 **Repositories with topic "${topic}"** (${repos.length} total):\n${repoList}`;
}

// Example usage:
console.log('=== Org Stats ===');
console.log(getOrgStats());

console.log('\n=== Search Example ===');
console.log(handleRepoQuery('api'));

console.log('\n=== Topic Search ===');
console.log(findReposByTopic('audience'));

// Export functions for use in actual Slack bot
module.exports = {
  handleRepoQuery,
  getOrgStats,
  findReposByTopic,
  analysisData
};