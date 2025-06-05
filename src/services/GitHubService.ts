import { Octokit } from '@octokit/rest';
import { RepositoryInfo, ContributorInfo, PackageInfo, ScanOptions } from '../types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'repo-reader/1.0.0',
    });
  }

  async getOrganizationRepositories(org: string, options: Partial<ScanOptions> = {}): Promise<RepositoryInfo[]> {
    const repositories: RepositoryInfo[] = [];
    let page = 1;
    const perPage = 100;

    console.log(`🔍 Fetching repositories for organization: ${org}`);

    while (true) {
      try {
        const response = await this.octokit.repos.listForOrg({
          org,
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
          page,
        });

        if (response.data.length === 0) {
          break;
        }

        console.log(`📄 Processing page ${page} (${response.data.length} repositories)`);

        for (const repo of response.data) {
          // Apply filters
          if (!options.includePrivate && repo.private) continue;
          if (!options.includeArchived && repo.archived) continue;
          if (!options.includeForks && repo.fork) continue;
          if (options.maxRepositories && repositories.length >= options.maxRepositories) {
            return repositories;
          }

          console.log(`  📂 Processing: ${repo.name}`);
          
          const repoInfo = await this.getRepositoryDetails(repo.owner.login, repo.name);
          repositories.push(repoInfo);
        }

        page++;
      } catch (error) {
        console.error(`❌ Error fetching repositories page ${page}:`, error);
        break;
      }
    }

    return repositories;
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<RepositoryInfo> {
    const [repoData, languagesData, contributorsData, readmeData, packageData] = await Promise.allSettled([
      this.octokit.repos.get({ owner, repo }),
      this.getRepositoryLanguages(owner, repo),
      this.getRepositoryContributors(owner, repo),
      this.getRepositoryReadme(owner, repo),
      this.getPackageInfo(owner, repo),
    ]);

    const repository = repoData.status === 'fulfilled' ? repoData.value.data : null;
    const languages = languagesData.status === 'fulfilled' ? languagesData.value : {};
    const contributors = contributorsData.status === 'fulfilled' ? contributorsData.value : [];
    const readme = readmeData.status === 'fulfilled' ? readmeData.value : null;
    const packageInfo = packageData.status === 'fulfilled' ? packageData.value : null;

    if (!repository) {
      throw new Error(`Failed to fetch repository data for ${owner}/${repo}`);
    }

    return {
      name: repository.name,
      fullName: repository.full_name,
      description: repository.description,
      url: repository.url,
      htmlUrl: repository.html_url,
      cloneUrl: repository.clone_url,
      language: repository.language,
      languages,
      topics: repository.topics || [],
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      watchers: repository.watchers_count,
      openIssues: repository.open_issues_count,
      size: repository.size,
      defaultBranch: repository.default_branch,
      createdAt: repository.created_at,
      updatedAt: repository.updated_at,
      pushedAt: repository.pushed_at,
      isPrivate: repository.private,
      isFork: repository.fork,
      isArchived: repository.archived,
      hasIssues: repository.has_issues,
      hasProjects: repository.has_projects,
      hasWiki: repository.has_wiki,
      hasPages: repository.has_pages,
      license: repository.license ? {
        name: repository.license.name,
        spdxId: repository.license.spdx_id,
      } : null,
      readme,
      packageInfo,
      contributors,
      dependencies: [], // Will be populated from package info
      relationships: [], // Will be computed later
    };
  }

  private async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await this.octokit.repos.listLanguages({ owner, repo });
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Could not fetch languages for ${owner}/${repo}`);
      return {};
    }
  }

  private async getRepositoryContributors(owner: string, repo: string): Promise<ContributorInfo[]> {
    try {
      const response = await this.octokit.repos.listContributors({ 
        owner, 
        repo, 
        per_page: 10 // Limit to top 10 contributors
      });
      
      return response.data.map(contributor => ({
        login: contributor.login || 'unknown',
        avatarUrl: contributor.avatar_url || '',
        contributions: contributor.contributions || 0,
        type: contributor.type || 'User',
      }));
    } catch (error) {
      console.warn(`⚠️ Could not fetch contributors for ${owner}/${repo}`);
      return [];
    }
  }

  private async getRepositoryReadme(owner: string, repo: string): Promise<{ content: string; encoding: string; size: number } | null> {
    try {
      const response = await this.octokit.repos.getReadme({ owner, repo });
      
      let content = '';
      if (response.data.encoding === 'base64') {
        content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      } else {
        content = response.data.content;
      }

      return {
        content: content.substring(0, 10000), // Limit README content to 10KB
        encoding: response.data.encoding,
        size: response.data.size,
      };
    } catch (error) {
      console.warn(`⚠️ Could not fetch README for ${owner}/${repo}`);
      return null;
    }
  }

  private async getPackageInfo(owner: string, repo: string): Promise<PackageInfo | null> {
    const packageFiles = [
      { path: 'package.json', type: 'npm' as const },
      { path: 'requirements.txt', type: 'python' as const },
      { path: 'pyproject.toml', type: 'python' as const },
      { path: 'go.mod', type: 'go' as const },
      { path: 'pom.xml', type: 'maven' as const },
      { path: 'build.gradle', type: 'maven' as const },
      { path: 'Cargo.toml', type: 'unknown' as const },
    ];

    for (const { path, type } of packageFiles) {
      try {
        const response = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
        });

        if ('content' in response.data && response.data.content) {
          const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
          return this.parsePackageFile(content, type, path);
        }
      } catch (error) {
        // File doesn't exist, continue to next
        continue;
      }
    }

    return null;
  }

  private parsePackageFile(content: string, type: PackageInfo['type'], filename: string): PackageInfo {
    try {
      switch (type) {
        case 'npm':
          const packageJson = JSON.parse(content);
          return {
            type: 'npm',
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
            scripts: packageJson.scripts || {},
            dependencies: packageJson.dependencies || {},
            devDependencies: packageJson.devDependencies || {},
          };

        case 'python':
          if (filename === 'requirements.txt') {
            const deps: Record<string, string> = {};
            content.split('\n').forEach(line => {
              const match = line.trim().match(/^([^=<>!]+)[=<>!].*$/);
              if (match) {
                deps[match[1]] = line.trim();
              }
            });
            return {
              type: 'python',
              dependencies: deps,
            };
          }
          // For pyproject.toml, we'd need a TOML parser
          return { type: 'python' };

        case 'go':
          const goModMatch = content.match(/module\s+(.+)/);
          return {
            type: 'go',
            name: goModMatch ? goModMatch[1] : undefined,
          };

        default:
          return { type };
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse ${filename}: ${error}`);
      return { type };
    }
  }
}
