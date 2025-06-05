import { RepositoryInfo, OrganizationSummary, RepositoryRelationship } from '../types';

export class RepositoryAnalyzer {
  
  analyzeOrganization(repositories: RepositoryInfo[], orgName: string): OrganizationSummary {
    console.log(`🔬 Analyzing ${repositories.length} repositories for ${orgName}`);

    const languages = this.aggregateLanguages(repositories);
    const topics = this.aggregateTopics(repositories);
    const relationships = this.computeRelationships(repositories);

    // Update repositories with computed relationships
    repositories.forEach(repo => {
      repo.relationships = relationships.filter(rel => 
        rel.target === repo.name || (rel as any).source === repo.name
      );
    });

    const summary: OrganizationSummary = {
      organization: orgName,
      scanDate: new Date().toISOString(),
      totalRepositories: repositories.length,
      publicRepositories: repositories.filter(r => !r.isPrivate).length,
      privateRepositories: repositories.filter(r => r.isPrivate).length,
      languages,
      topics,
      totalStars: repositories.reduce((sum, repo) => sum + repo.stars, 0),
      totalForks: repositories.reduce((sum, repo) => sum + repo.forks, 0),
      repositories,
      relationships: {
        dependencies: this.extractDependencyRelationships(repositories),
        topicClusters: this.clusterByTopics(repositories),
        contributorOverlap: this.findContributorOverlap(repositories),
      },
    };

    return summary;
  }

  private aggregateLanguages(repositories: RepositoryInfo[]): Record<string, number> {
    const languages: Record<string, number> = {};
    
    repositories.forEach(repo => {
      Object.entries(repo.languages).forEach(([lang, bytes]) => {
        languages[lang] = (languages[lang] || 0) + bytes;
      });
    });

    // Sort by usage and return top languages
    return Object.fromEntries(
      Object.entries(languages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
    );
  }

  private aggregateTopics(repositories: RepositoryInfo[]): Record<string, number> {
    const topics: Record<string, number> = {};
    
    repositories.forEach(repo => {
      repo.topics.forEach(topic => {
        topics[topic] = (topics[topic] || 0) + 1;
      });
    });

    return Object.fromEntries(
      Object.entries(topics)
        .sort(([,a], [,b]) => b - a)
    );
  }

  private computeRelationships(repositories: RepositoryInfo[]): RepositoryRelationship[] {
    const relationships: RepositoryRelationship[] = [];

    // Find repositories with similar topics
    relationships.push(...this.findSimilarTopicRelationships(repositories));
    
    // Find repositories with shared contributors
    relationships.push(...this.findSharedContributorRelationships(repositories));
    
    // Find dependency relationships (from package.json, etc.)
    relationships.push(...this.findDependencyRelationships(repositories));

    return relationships;
  }

  private findSimilarTopicRelationships(repositories: RepositoryInfo[]): RepositoryRelationship[] {
    const relationships: RepositoryRelationship[] = [];

    for (let i = 0; i < repositories.length; i++) {
      for (let j = i + 1; j < repositories.length; j++) {
        const repo1 = repositories[i];
        const repo2 = repositories[j];
        
        const commonTopics = repo1.topics.filter(topic => repo2.topics.includes(topic));
        
        if (commonTopics.length > 0) {
          const strength = commonTopics.length / Math.max(repo1.topics.length, repo2.topics.length);
          
          if (strength > 0.3) { // Only include significant overlaps
            relationships.push({
              type: 'similar-topics',
              target: repo2.name,
              strength,
              details: { commonTopics },
            });
          }
        }
      }
    }

    return relationships;
  }

  private findSharedContributorRelationships(repositories: RepositoryInfo[]): RepositoryRelationship[] {
    const relationships: RepositoryRelationship[] = [];

    for (let i = 0; i < repositories.length; i++) {
      for (let j = i + 1; j < repositories.length; j++) {
        const repo1 = repositories[i];
        const repo2 = repositories[j];
        
        const sharedContributors = repo1.contributors.filter(c1 =>
          repo2.contributors.some(c2 => c1.login === c2.login)
        );
        
        if (sharedContributors.length > 0) {
          const strength = sharedContributors.length / 
            Math.max(repo1.contributors.length, repo2.contributors.length);
          
          if (strength > 0.2) { // Only include significant overlaps
            relationships.push({
              type: 'shared-contributors',
              target: repo2.name,
              strength,
              details: { 
                sharedContributors: sharedContributors.map(c => c.login) 
              },
            });
          }
        }
      }
    }

    return relationships;
  }

  private findDependencyRelationships(repositories: RepositoryInfo[]): RepositoryRelationship[] {
    const relationships: RepositoryRelationship[] = [];
    const repoNames = new Set(repositories.map(r => r.name));

    repositories.forEach(repo => {
      if (repo.packageInfo?.dependencies) {
        Object.keys(repo.packageInfo.dependencies).forEach(depName => {
          // Check if this dependency is another repo in the same organization
          if (repoNames.has(depName) || repoNames.has(depName.replace('@org/', ''))) {
            relationships.push({
              type: 'dependency',
              target: depName,
              strength: 1.0,
              details: {
                version: repo.packageInfo!.dependencies![depName],
                type: 'runtime'
              },
            });
          }
        });
      }
    });

    return relationships;
  }

  private extractDependencyRelationships(repositories: RepositoryInfo[]) {
    const dependencies: Array<{ source: string; target: string; type: string }> = [];
    
    repositories.forEach(repo => {
      repo.relationships
        .filter(rel => rel.type === 'dependency')
        .forEach(rel => {
          dependencies.push({
            source: repo.name,
            target: rel.target,
            type: rel.details?.type || 'unknown',
          });
        });
    });

    return dependencies;
  }

  private clusterByTopics(repositories: RepositoryInfo[]): Record<string, string[]> {
    const clusters: Record<string, string[]> = {};
    
    repositories.forEach(repo => {
      repo.topics.forEach(topic => {
        if (!clusters[topic]) {
          clusters[topic] = [];
        }
        clusters[topic].push(repo.name);
      });
    });

    // Only return clusters with more than one repository
    return Object.fromEntries(
      Object.entries(clusters).filter(([, repos]) => repos.length > 1)
    );
  }

  private findContributorOverlap(repositories: RepositoryInfo[]) {
    const contributorRepos: Record<string, string[]> = {};
    
    repositories.forEach(repo => {
      repo.contributors.forEach(contributor => {
        if (!contributorRepos[contributor.login]) {
          contributorRepos[contributor.login] = [];
        }
        contributorRepos[contributor.login].push(repo.name);
      });
    });

    // Only return contributors who work on multiple repositories
    return Object.entries(contributorRepos)
      .filter(([, repos]) => repos.length > 1)
      .map(([contributor, repos]) => ({ contributor, repositories: repos }));
  }

  generateMarkdownSummary(summary: OrganizationSummary): string {
    const md = [];
    
    md.push(`# ${summary.organization} Repository Analysis`);
    md.push(`*Generated on ${new Date(summary.scanDate).toLocaleDateString()}*\n`);
    
    md.push(`## Overview`);
    md.push(`- **Total Repositories:** ${summary.totalRepositories}`);
    md.push(`- **Public:** ${summary.publicRepositories}`);
    md.push(`- **Private:** ${summary.privateRepositories}`);
    md.push(`- **Total Stars:** ${summary.totalStars.toLocaleString()}`);
    md.push(`- **Total Forks:** ${summary.totalForks.toLocaleString()}\n`);
    
    md.push(`## Top Languages`);
    Object.entries(summary.languages).slice(0, 10).forEach(([lang, bytes]) => {
      const mb = (bytes / 1024 / 1024).toFixed(1);
      md.push(`- **${lang}:** ${mb} MB`);
    });
    md.push('');
    
    md.push(`## Popular Topics`);
    Object.entries(summary.topics).slice(0, 15).forEach(([topic, count]) => {
      md.push(`- **${topic}:** ${count} repositories`);
    });
    md.push('');
    
    md.push(`## Repository Clusters`);
    Object.entries(summary.relationships.topicClusters).forEach(([topic, repos]) => {
      if (repos.length > 2) {
        md.push(`### ${topic}`);
        repos.forEach(repo => md.push(`- ${repo}`));
        md.push('');
      }
    });
    
    return md.join('\n');
  }
}
