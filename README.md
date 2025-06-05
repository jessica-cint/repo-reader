# GitHub Repository Reader

A TypeScript tool to fetch and analyze GitHub organization repositories.

## Features

- 🔍 Scan GitHub organizations for repositories
- 📊 Analyze repository metadata (languages, topics, stars, forks)
- 📝 Extract README content (up to 10KB per repository)
- 📦 Detect package files and dependencies
- 🔗 Find relationships between repositories
- 💾 Export analysis as JSON

## Installation

```bash
npm install
npm run build
```

## Configuration

Create a `.env` file with your GitHub token:

```bash
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_ORG=your_organization_name
```

## Usage

### Basic scan
```bash
npm start scan --org lucidhq
```

### Include private repositories
```bash
npm start scan --org lucidhq --include-private
```

### Limit number of repositories
```bash
npm start scan --org lucidhq --max-repos 50
```

### Custom output file
```bash
npm start scan --org lucidhq --output my-analysis.json
```

## Output Format

The tool generates a JSON file containing:

- **Organization metadata**: Name, scan date, repository counts
- **Language statistics**: Code size by programming language
- **Topic analysis**: Popular repository topics
- **Repository details**: Name, description, README content, dependencies
- **Relationships**: Shared topics, contributors, dependencies

## Example Output Structure

```json
{
  "organization": "lucidhq",
  "scanDate": "2025-06-05T23:20:40.065Z",
  "totalRepositories": 1121,
  "publicRepositories": 6,
  "privateRepositories": 1115,
  "languages": {
    "HTML": 144141952,
    "TypeScript": 24046567,
    "JavaScript": 13918022
  },
  "topics": {
    "audience": 32,
    "infrastructure": 8,
    "golang": 6
  },
  "repositories": [
    {
      "id": 123456,
      "name": "example-repo",
      "description": "An example repository",
      "language": "TypeScript",
      "topics": ["api", "typescript"],
      "readme": {
        "content": "# Example\n\nThis is an example...",
        "size": 1024
      }
    }
  ]
}
```

## Requirements

- Node.js 18+
- GitHub Personal Access Token
- Access to target GitHub organization

## License

MIT