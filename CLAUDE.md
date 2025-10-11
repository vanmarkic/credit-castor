# Do's

## Code Quality & Best Practices
- apply the boy scout rule - leave the codebase cleaner than you found it
- if something isn't found in the terminal, check PWD and make sure you are in the right directory
- aim at a good ratio of LOCs over features/bugs solved, apply the concept to dependencies as well
- always try to improve existing code instead of adding new code
- always try to remove code instead of adding new code
- removing code is a very good thing
- solve underlying causes rather than symptoms
- detect code smell, where some code that works is actually a patch for a deeper issue
- look for root causes

## Test Driven Development
- apply Test Driven Development
- write tests BEFORE changing a feature or solving a bug (red-green-refactor)
- write failing test first to reproduce the bug, then fix it
- write tests for new features before implementing them
- everytime you want to write a test script, try to write a proper test runnable with vitest instead
- use vitest instead of jest
- use "npm run test" rather than "npm test" to run tests
- try to run and test whatever you write and automatically continue to solve errors until it works

## Documentation
- place all ai-generated .md documents in ./docs
- always place generated \*.md files in a ./docs folder at the root of the project
- always check if an existing \*.md file can be modified instead of creating a new one for keeping track of your progress
- store the generate \*.md files in the appropriate folder (e.g. development/, analysis/, history/, ...)
- save generated \*.md files only after manual review and necessary edits

## Testing Tools
- run playwright tests headless locally, I don't want to see the browser UI
- run playwright in UI mode, e.g. "npx playwright test --ui" when debugging tests
- if handy, run playwright test with vscode extension
- make sure to prefer running self terminating command in the terminal, e.g. "npx playwright test" instead of "npx playwright test --watch", look for the equivalent in other tools

## Infrastructure
- use mcp servers
- use context7 mcp server
