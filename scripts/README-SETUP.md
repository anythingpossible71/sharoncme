# CrunchyCone Auto-Setup Script

Automated project initialization script that performs all setup steps required for a new CrunchyCone project.

## Overview

This script automates the manual setup process described in `.cursor/rules`, making it easy for AI assistants (like Cursor) and developers to initialize a CrunchyCone project with a single command.

## Usage

### Basic Setup

```bash
npm run setup
```

**Works on fresh clone** - No need to run `npm install` first! The script automatically bootstraps dependencies before running.

This will automatically:
1. **Bootstrap dependencies** (installs npm packages if `node_modules` missing)
2. Install dependencies (`npm install`)
3. Create `.env` file with secure secrets
4. Create and seed the database
5. Generate Prisma client
6. Configure CrunchyCone integration (if `crunchycone.toml` exists)
7. Install git hooks
8. **Start development server and open browser**

The script completes and you're immediately ready to develop!

### Advanced Options

```bash
# Force mode - reset everything and start fresh
npm run setup:force

# Verbose output - show detailed information
npm run setup:verbose

# Skip specific steps
npm run setup -- --skip-crunchycone
npm run setup -- --skip-hooks
npm run setup -- --skip-db

# Skip auto-starting dev server (useful for CI/automation)
npm run setup -- --no-dev

# Combine multiple options
npm run setup -- --verbose --skip-crunchycone
```

## Command-Line Options

| Option | Description |
|--------|-------------|
| `--auto`, `--yes` | Run without prompts (default behavior) |
| `--force` | Remove existing setup and start fresh |
| `--skip-deps` | Skip dependency installation |
| `--skip-env` | Skip `.env` file creation |
| `--skip-db` | Skip database setup |
| `--skip-crunchycone` | Skip CrunchyCone integration |
| `--skip-hooks` | Skip git hooks installation |
| `--no-dev` | Skip auto-starting development server (useful for CI/automation) |
| `--verbose`, `-v` | Show detailed output |
| `--quiet`, `-q` | Minimal output (errors only) |
| `--help`, `-h` | Show help message |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Setup completed successfully |
| `1` | Setup failed (critical error) |
| `2` | Setup completed with warnings |

## Setup Steps

The script performs these steps in order:

### 0. Bootstrap (Automatic)
- **Runs before importing any setup code**
- Checks if `node_modules` exists
- If missing, automatically runs `npm install` using only Node.js built-ins
- This prevents import errors when setup script dependencies (chalk, ora) don't exist yet
- **Critical**: Must succeed for setup to continue

### 1. Dependencies
- Checks if `node_modules` exists and is properly populated
- Runs `npm install` if needed (or if `--force` flag used)
- **Critical**: Setup fails if this step fails

### 2. Environment Configuration
- Checks if `.env` exists with required variables
- Runs `npm run setup-env` to generate secure `AUTH_SECRET` and `NEXTAUTH_SECRET`
- Creates `.env` from `.env.example` template
- **Critical**: Setup fails if this step fails

### 3. Database Setup
- Checks if `db/prod.db` exists
- Runs `npm run db:reset` to create database and seed data
- Creates admin and user roles
- **Critical**: Setup fails if this step fails

### 4. Prisma Client
- Checks if Prisma client is generated
- Runs `npx prisma generate` to create TypeScript types
- **Critical**: Setup fails if this step fails

### 5. CrunchyCone Integration (Optional)
- Only runs if `crunchycone.toml` exists
- Checks authentication status
- Links project to CrunchyCone platform if authenticated
- **Non-critical**: Setup continues even if this fails

### 6. Git Hooks (Optional)
- Checks if pre-commit hook exists
- Runs `npm run hooks:install` to set up hooks
- **Non-critical**: Setup continues even if this fails

### 7. Verification
- Verifies all critical steps completed successfully
- Reports any issues found
- **Critical**: Reports what failed for troubleshooting

## Examples

### First-time Setup

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Run auto-setup (no need for npm install first!)
npm run setup

# Setup automatically starts the dev server, or run manually:
npm run dev:open
```

### Reset and Rebuild

```bash
# Force complete reset
npm run setup:force

# Or manually reset specific parts
rm -rf node_modules .env db/prod.db
npm run setup
```

### CI/CD Usage

```bash
# Quiet mode for logs
npm run setup -- --quiet

# Skip optional steps for faster builds
npm run setup -- --skip-hooks --skip-crunchycone
```

### Debugging Issues

```bash
# Verbose output to see what's happening
npm run setup:verbose

# Skip problematic steps
npm run setup -- --skip-db --verbose
```

## Design for Cursor AI

This script is specifically designed for non-interactive use by Cursor AI:

- **No prompts**: All decisions are made automatically
- **Clear error messages**: Reports exactly what failed and why
- **Partial failures**: Non-critical steps can fail without stopping setup
- **Structured output**: Easy for AI to parse and understand
- **Exit codes**: Programmatic success/failure detection

### Cursor Usage Example

When Cursor needs to set up a project:

```javascript
// Cursor can run:
await exec('npm run setup');

// And check the exit code:
// - 0: Success, proceed with development
// - 1: Critical failure, report to user
// - 2: Warning, may proceed but user should know
```

## Troubleshooting

### Bootstrap fails to install dependencies
- The script automatically runs `npm install` before setup
- If this fails, check your Node.js/npm installation
- Try running `npm install` manually to see the error
- Make sure you have network access to npmjs.com

### Database errors
- Delete `db/prod.db` and run `npm run setup -- --skip-deps --skip-env`
- Or use force mode: `npm run setup:force`

### Environment variable errors
- Delete `.env` and run `npm run setup -- --skip-deps --skip-db`
- Or manually run: `npm run setup-env`

### Git hooks errors
- These are non-critical and won't stop setup
- Install manually later: `npm run hooks:install`

### CrunchyCone errors
- These are non-critical and won't stop setup
- Authenticate manually: `npx crunchycone-cli auth login`
- Link manually: `npx crunchycone-cli project link --setup`

## File Structure

```
scripts/
├── auto-setup.js              # Main entry point
├── setup/
│   ├── index.js               # Setup orchestrator
│   ├── steps/
│   │   ├── 01-dependencies.js
│   │   ├── 02-environment.js
│   │   ├── 03-database.js
│   │   ├── 04-prisma-client.js
│   │   ├── 05-crunchycone.js
│   │   ├── 06-git-hooks.js
│   │   └── 07-verification.js
│   └── utils/
│       ├── cli.js             # Command execution
│       ├── logger.js          # Output formatting
│       ├── prompts.js         # User prompts (unused for auto mode)
│       ├── checks.js          # File checks
│       └── paths.js           # Path utilities
└── README-SETUP.md            # This file
```

## Development

### Adding New Steps

1. Create a new step file in `scripts/setup/steps/`
2. Implement the step class with:
   - `shouldRun()` - Check if step needs to run
   - `execute()` - Perform the step
   - `verify()` - Verify step completed (optional)
3. Register the step in `scripts/setup/index.js`
4. Mark as `critical: true` if setup should fail when step fails

### Testing

```bash
# Test with verbose output
npm run setup:verbose

# Test force mode
npm run setup:force

# Test with specific steps skipped
npm run setup -- --skip-db --skip-crunchycone --verbose
```

## Cross-Platform Compatibility

This script uses cross-platform Node.js libraries:

- **execa**: Cross-platform command execution
- **fs-extra**: Enhanced file operations
- **chalk**: Terminal colors (works on Windows CMD/PowerShell)
- **ora**: Spinners (works on Windows CMD/PowerShell)
- **prompts**: User input (unused in auto mode)

Tested on:
- ✅ macOS (Terminal, iTerm2)
- ✅ Linux (bash, zsh)
- ✅ Windows (CMD, PowerShell, Git Bash, WSL)

## Related Documentation

- `.cursor/rules/00-ALWAYS-READ.mdc` - Quick setup checklist
- `.cursor/rules/01-CRITICAL-setup.mdc` - Detailed setup guide
- `.cursor/rules/02-CRITICAL-prisma.mdc` - Database setup guide
- `CLAUDE.md` - Project documentation
