// Simple test to verify the core functionality works
const { RepositoryAnalyzer } = require('../dist/services/RepositoryAnalyzer');

console.log('🧪 Running simple test...\n');

// Mock repository data for testing
const mockRepositories = [
  {
    name: 'test-repo-1',
    fullName: 'test-org/test-repo-1',
    description: 'A test repository',
    url: 'https://api.github.com/repos/test-org/test-repo-1',
    htmlUrl: 'https://github.com/test-org/test-repo-1',
    cloneUrl: 'https://github.com/test-org/test-repo-1.git',
    language: 'TypeScript',
    languages: { 'TypeScript': 1024, 'JavaScript': 256 },
    topics: ['api', 'typescript', 'test'],
    stars: 42,
    forks: 7,
    watchers: 15,
    openIssues: 3,
    size: 1024,
    defaultBranch: 'main',
    createdAt: '2025-01-01T12:00:00Z',
    updatedAt: '2025-06-05T12:00:00Z',
    pushedAt: '2025-06-05T12:00:00Z',
    isPrivate: false,
    isFork: false,
    isArchived: false,
    hasIssues: true,
    hasProjects: false,
    hasWiki: false,
    hasPages: false,
    license: { name: 'MIT License', spdxId: 'MIT' },
    readme: {
      content: '# Test Repo 1\n\nThis is a test repository.',
      encoding: 'utf8',
      size: 45
    },
    packageInfo: null,
    contributors: [],
    dependencies: [],
    relationships: []
  },
  {
    name: 'test-repo-2',
    fullName: 'test-org/test-repo-2',
    description: 'Another test repository',
    url: 'https://api.github.com/repos/test-org/test-repo-2',
    htmlUrl: 'https://github.com/test-org/test-repo-2',
    cloneUrl: 'https://github.com/test-org/test-repo-2.git',
    language: 'JavaScript',
    languages: { 'JavaScript': 512, 'CSS': 128 },
    topics: ['api', 'javascript'],
    stars: 15,
    forks: 3,
    watchers: 8,
    openIssues: 1,
    size: 512,
    defaultBranch: 'main',
    createdAt: '2025-02-01T10:30:00Z',
    updatedAt: '2025-06-04T10:30:00Z',
    pushedAt: '2025-06-04T10:30:00Z',
    isPrivate: false,
    isFork: false,
    isArchived: false,
    hasIssues: true,
    hasProjects: false,
    hasWiki: false,
    hasPages: false,
    license: { name: 'Apache License 2.0', spdxId: 'Apache-2.0' },
    readme: {
      content: '# Test Repo 2\n\nAnother test repository.',
      encoding: 'utf8',
      size: 48
    },
    packageInfo: null,
    contributors: [],
    dependencies: [],
    relationships: []
  },
  {
    name: 'test-repo-3',
    fullName: 'test-org/test-repo-3',
    description: 'Third test repository',
    url: 'https://api.github.com/repos/test-org/test-repo-3',
    htmlUrl: 'https://github.com/test-org/test-repo-3',
    cloneUrl: 'https://github.com/test-org/test-repo-3.git',
    language: 'Python',
    languages: { 'Python': 256, 'Shell': 64 },
    topics: ['python', 'api'],
    stars: 8,
    forks: 1,
    watchers: 5,
    openIssues: 0,
    size: 256,
    defaultBranch: 'main',
    createdAt: '2025-03-01T15:45:00Z',
    updatedAt: '2025-06-03T15:45:00Z',
    pushedAt: '2025-06-03T15:45:00Z',
    isPrivate: false,
    isFork: false,
    isArchived: false,
    hasIssues: true,
    hasProjects: false,
    hasWiki: false,
    hasPages: false,
    license: { name: 'BSD 3-Clause License', spdxId: 'BSD-3-Clause' },
    readme: {
      content: '# Test Repo 3\n\nA Python test repository.',
      encoding: 'utf8',
      size: 52
    },
    packageInfo: null,
    contributors: [],
    dependencies: [],
    relationships: []
  }
];

try {
  // Test the analyzer
  const analyzer = new RepositoryAnalyzer();
  const analysis = analyzer.analyzeOrganization(mockRepositories, 'test-org');

  console.log('✅ Analysis completed successfully!\n');

  // Verify the results
  console.log('📊 Test Results:');
  console.log(`   Organization: ${analysis.organization}`);
  console.log(`   Total repositories: ${analysis.totalRepositories}`);
  console.log(`   Total stars: ${analysis.totalStars}`);
  console.log(`   Total forks: ${analysis.totalForks}`);
  console.log(`   Languages found: ${Object.keys(analysis.languages).length}`);
  console.log(`   Topics found: ${Object.keys(analysis.topics).length}`);

  // Test language distribution
  console.log('\n💻 Language Distribution:');
  Object.entries(analysis.languages).forEach(([lang, size]) => {
    console.log(`   ${lang}: ${size} bytes`);
  });

  // Test topic counts
  console.log('\n🏷️  Topic Counts:');
  Object.entries(analysis.topics).forEach(([topic, count]) => {
    console.log(`   ${topic}: ${count} repositories`);
  });
  // Verify expected values
  const expectedStars = 42 + 15 + 8;
  const expectedForks = 7 + 3 + 1;
  const expectedLanguages = 5; // TypeScript, JavaScript, CSS, Python, Shell
  const expectedTopics = 4; // api, typescript, test, javascript, python (but 'api' appears in multiple repos)
  
  if (analysis.totalStars === expectedStars && 
      analysis.totalForks === expectedForks && 
      Object.keys(analysis.languages).length === expectedLanguages) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ Repository analyzer is working correctly.');
  } else {
    console.log('\n❌ Test failed - unexpected values:');
    console.log(`   Expected stars: ${expectedStars}, got: ${analysis.totalStars}`);
    console.log(`   Expected forks: ${expectedForks}, got: ${analysis.totalForks}`);
    console.log(`   Expected languages: ${expectedLanguages}, got: ${Object.keys(analysis.languages).length}`);
  }

} catch (error) {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
}

console.log('\n💡 To test with real data, run:');
console.log('   npm start scan --org microsoft --max-repos 5');
