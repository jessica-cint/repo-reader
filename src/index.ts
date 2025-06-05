#!/usr/bin/env node

import { Command } from 'commander';
import { GitHubService } from './services/GitHubService';
import { RepositoryAnalyzer } from './services/RepositoryAnalyzer';
import { config } from 'dotenv';
import * as fs from 'fs/promises';

// Load environment variables
config();

const program = new Command();

program
  .name('repo-reader')
  .description('GitHub organization repository analyzer')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan and analyze repositories from a GitHub organization')
  .requiredOption('-o, --org <organization>', 'GitHub organization name')
  .option('-t, --token <token>', 'GitHub personal access token (or set GITHUB_TOKEN env var)')
  .option('--include-private', 'Include private repositories', false)
  .option('--include-archived', 'Include archived repositories', false)
  .option('--include-forks', 'Include forked repositories', false)
  .option('--max-repos <number>', 'Maximum number of repositories to analyze', '100')
  .option('--output <file>', 'Output file name (default: <org>-analysis.json)')
  .action(async (options) => {
    try {
      const token = options.token || process.env.GITHUB_TOKEN;
      
      if (!token) {
        console.error('❌ GitHub token is required. Set GITHUB_TOKEN environment variable or use --token option.');
        process.exit(1);
      }

      console.log(`🔍 Scanning ${options.org} organization...`);
      
      const githubService = new GitHubService(token);
      const analyzer = new RepositoryAnalyzer();

      const scanOptions = {
        organization: options.org,
        includePrivate: options.includePrivate,
        includeArchived: options.includeArchived,
        includeForks: options.includeForks,
        maxRepositories: parseInt(options.maxRepos),
      };

      const repositories = await githubService.getOrganizationRepositories(options.org, scanOptions);
      console.log(`✅ Found ${repositories.length} repositories`);

      console.log('📊 Analyzing repositories...');
      const analysis = analyzer.analyzeOrganization(repositories, options.org);

      const outputFile = options.output || `${options.org}-analysis.json`;
      await fs.writeFile(outputFile, JSON.stringify(analysis, null, 2));

      console.log('\n📈 Analysis Complete!');
      console.log(`📁 Results saved to: ${outputFile}`);
      console.log(`📊 Total repositories: ${analysis.totalRepositories}`);
      console.log(`🌟 Total stars: ${analysis.totalStars || 0}`);
      console.log(`🍴 Total forks: ${analysis.totalForks || 0}`);
      console.log(`💻 Languages found: ${Object.keys(analysis.languages).length}`);
      console.log(`🏷️  Topics found: ${Object.keys(analysis.topics).length}`);

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();