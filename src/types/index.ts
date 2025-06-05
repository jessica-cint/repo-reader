export interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  size: number; // in KB
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;  license: {
    name: string;
    spdxId: string | null;
  } | null;
  readme: {
    content: string;
    encoding: string;
    size: number;
  } | null;
  packageInfo: PackageInfo | null;
  contributors: ContributorInfo[];
  dependencies: DependencyInfo[];
  relationships: RepositoryRelationship[];
}

export interface PackageInfo {
  type: 'npm' | 'python' | 'go' | 'maven' | 'nuget' | 'unknown';
  name?: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ContributorInfo {
  login: string;
  avatarUrl: string;
  contributions: number;
  type: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'runtime' | 'development' | 'peer';
  ecosystem: string;
}

export interface RepositoryRelationship {
  type: 'dependency' | 'similar-topics' | 'shared-contributors' | 'fork-of';
  target: string;
  strength: number; // 0-1 score
  details?: any;
}

export interface OrganizationSummary {
  organization: string;
  scanDate: string;
  totalRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
  languages: Record<string, number>;
  topics: Record<string, number>;
  totalStars: number;
  totalForks: number;
  repositories: RepositoryInfo[];
  relationships: {
    dependencies: Array<{
      source: string;
      target: string;
      type: string;
    }>;
    topicClusters: Record<string, string[]>;
    contributorOverlap: Array<{
      contributor: string;
      repositories: string[];
    }>;
  };
}

export interface ScanOptions {
  organization: string;
  includePrivate: boolean;
  includeArchived: boolean;
  includeForks: boolean;
  maxRepositories?: number;
  outputFile?: string;
}
