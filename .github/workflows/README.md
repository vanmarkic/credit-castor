# GitHub Actions Workflows

This directory contains automated workflows for the Credit Castor project.

## Available Workflows

### 1. 🚀 Deploy to GitHub Pages (`deploy.yml`)

**Trigger:** Automatic on push to `master` branch, or manual via Actions tab

**Purpose:** Builds and deploys the Astro site to GitHub Pages

**What it does:**
- Installs dependencies
- Builds the static site with Astro
- Deploys to GitHub Pages

---

### 2. 🔢 Version Bump (`version-bump.yml`)

**Trigger:** Manual via Actions tab

**Purpose:** Manually bump the version number with full control

**How to use:**

1. Go to **Actions** tab in GitHub
2. Select **"Version Bump"** workflow
3. Click **"Run workflow"**
4. Choose bump type:
   - **patch** - Bug fixes (1.0.0 → 1.0.1)
   - **minor** - New features (1.0.0 → 1.1.0)
   - **major** - Breaking changes (1.0.0 → 2.0.0)
   - **auto** - Auto-detect from commit messages

**What it does:**
- Reads current version from `src/utils/version.ts`
- Calculates new version based on your choice
- Generates changelog from commit history
- Updates `src/utils/version.ts` with new version
- Updates `package.json` with new version
- Creates git tag (e.g., `v1.0.1`)
- Creates GitHub Release with changelog
- Pushes changes and tag to repository

**Commit Message Conventions (for auto-detect):**
- `feat:` or `feature:` → minor bump
- `fix:` → patch bump
- `BREAKING CHANGE:` or `!:` → major bump
- `docs:`, `chore:`, `test:`, etc. → patch bump

**Example commit messages:**
```
feat: add portage lot tracking
fix: resolve calculation error in notary fees
BREAKING CHANGE: remove support for old data format
chore: update dependencies
```

---

### 3. 🤖 Auto Version Bump (`auto-version-bump.yml`)

**Trigger:** Automatic on push to `master` branch (when source files change)

**Purpose:** Automatically bump version on every meaningful push

**What triggers it:**
- Changes to `.ts`, `.tsx`, or `.astro` files in `src/`
- Changes to `package.json`

**What it ignores:**
- Test files (`*.test.ts`, `*.test.tsx`)
- Markdown files (`*.md`)
- Documentation folder (`docs/`)
- Its own version bump commits (`[skip ci]`)

**What it does:**
1. **Detects changes** since last tag
2. **Auto-determines bump type:**
   - Breaking changes (`BREAKING CHANGE:` or `!:`) → major
   - New features (`feat:`) → minor
   - Everything else → patch
3. **Generates changelog** from commits
4. **Updates version files:**
   - `src/utils/version.ts`
   - `package.json`
5. **Creates git tag** (e.g., `v1.0.2`)
6. **Creates GitHub Release** with changelog
7. **Pushes everything** back to repository

**Safety features:**
- Skips if last commit was already a version bump
- Uses `[skip ci]` to prevent infinite loops
- Only runs when actual source code changes

---

## Version Management

### Current Version
The single source of truth for the version is:
```typescript
// src/utils/version.ts
export const RELEASE_VERSION = '1.0.0';
```

### How Versions Work

1. **Development workflow:**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: add new feature"
   git push origin master

   # Auto version bump runs automatically!
   # - Detects "feat:" → minor bump
   # - Updates 1.0.0 → 1.1.0
   # - Creates tag v1.1.0
   # - Creates GitHub Release
   ```

2. **Manual control:**
   - Use the **Version Bump** workflow when you want explicit control
   - Choose the exact bump type you want
   - Useful for hotfixes or when preparing releases

3. **Version validation:**
   - JSON export includes `releaseVersion` field
   - On import, version is checked for compatibility
   - Incompatible versions show: **"Envoie le fichier à Dragan"**

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0) - Breaking changes that make old data incompatible
- **MINOR** (1.0.0 → 1.1.0) - New features that are backward compatible
- **PATCH** (1.0.0 → 1.0.1) - Bug fixes that are backward compatible

### Best Practices

1. **Use conventional commits:**
   ```
   feat: add new calculation method
   fix: resolve rounding error
   docs: update README
   chore: upgrade dependencies
   test: add unit tests
   refactor: simplify calculation logic
   perf: optimize rendering
   ```

2. **Breaking changes:**
   ```
   feat!: redesign data structure

   BREAKING CHANGE: The participant data structure has been
   completely redesigned. Old JSON files will not load.
   ```

3. **Let auto-bump do its job:**
   - Most of the time, just commit and push
   - Auto-bump will handle versioning automatically
   - Only use manual bump for special cases

4. **Check the releases:**
   - Go to GitHub Releases page
   - See automatically generated changelogs
   - Download assets if needed

---

## Troubleshooting

### Workflow not running?
- Check the `paths:` filter in `auto-version-bump.yml`
- Make sure you're pushing to `master` branch
- Check if last commit had `[skip ci]` tag

### Version not updating?
- Check workflow logs in Actions tab
- Ensure `src/utils/version.ts` exists
- Verify file format matches expected pattern

### Infinite loop protection
Both workflows include `[skip ci]` in their commit messages to prevent:
1. Auto-bump creates version commit
2. That commit triggers auto-bump again
3. Infinite loop!

The workflows skip themselves if they detect their own commits.

---

## Files Modified by Workflows

These files are automatically updated by the workflows:

1. **`src/utils/version.ts`** - RELEASE_VERSION constant
2. **`package.json`** - version field
3. **Git tags** - Created for each release
4. **GitHub Releases** - Created with changelogs

**Never manually edit these during a workflow run!**

---

## Monitoring

### View workflow runs:
1. Go to GitHub repository
2. Click **Actions** tab
3. See all workflow runs and their status

### View releases:
1. Go to GitHub repository
2. Click **Releases** (right sidebar)
3. See all tagged versions with changelogs

---

## Quick Reference

| Task | Workflow | Trigger |
|------|----------|---------|
| Deploy site | `deploy.yml` | Push to master |
| Auto version | `auto-version-bump.yml` | Push source changes |
| Manual version | `version-bump.yml` | Manual trigger |

---

## Examples

### Example 1: Feature Development
```bash
# Work on feature
git commit -m "feat: add portage lot calculations"
git push

# ✨ Auto-bump runs → 1.0.0 → 1.1.0
# 📦 Release v1.1.0 created automatically
```

### Example 2: Bug Fix
```bash
# Fix bug
git commit -m "fix: correct notary fee calculation"
git push

# 🐛 Auto-bump runs → 1.1.0 → 1.1.1
# 📦 Release v1.1.1 created automatically
```

### Example 3: Breaking Change
```bash
# Major refactor
git commit -m "refactor!: redesign data model

BREAKING CHANGE: Participant structure has been redesigned.
Old JSON exports will not be compatible."
git push

# 🚨 Auto-bump runs → 1.1.1 → 2.0.0
# 📦 Release v2.0.0 created automatically
```

### Example 4: Manual Hotfix
1. Fix critical bug on separate branch
2. Merge to master
3. Go to Actions → Version Bump
4. Select "patch" manually
5. Creates v2.0.1 immediately

---

## Support

For questions or issues:
- Check workflow logs in Actions tab
- Review this documentation
- Contact Dragan for workflow issues
