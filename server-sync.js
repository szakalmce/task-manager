// Auto-sync server for Task Manager
// Monitors local file and syncs with GitHub

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FILE_PATH = path.join(__dirname, 'codzienne-dzialania.md');
const DEBOUNCE_MS = 120000; // 120 seconds
const PULL_INTERVAL_MS = 180000; // 3 minutes

let debounceTimer = null;
let lastFileContent = null;

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (err) {
  console.log('No dotenv package, skipping .env loading');
}

// Initialize - read current file content
function initialize() {
  try {
    lastFileContent = fs.readFileSync(FILE_PATH, 'utf-8');
    console.log('✓ Initialized - monitoring:', FILE_PATH);
    console.log('✓ Auto-commit delay:', DEBOUNCE_MS / 1000, 'seconds');
    console.log('✓ Auto-pull interval:', PULL_INTERVAL_MS / 1000, 'seconds');
  } catch (err) {
    console.error('Error reading file:', err.message);
  }
}

// Execute git command
function gitCommand(command) {
  try {
    const result = execSync(command, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Commit and push changes
function commitAndPush() {
  console.log('\n📤 Starting auto-commit and push...');

  // Check if there are changes
  const status = gitCommand('git status --porcelain codzienne-dzialania.md');

  if (!status.success || !status.output.trim()) {
    console.log('   No changes to commit');
    return;
  }

  console.log('   Changes detected, committing...');

  // Add file
  const add = gitCommand('git add codzienne-dzialania.md');
  if (!add.success) {
    console.error('   ✗ Failed to add file:', add.error);
    return;
  }

  // Commit
  const timestamp = new Date().toISOString();
  const commit = gitCommand(`git commit -m "Auto-sync: Update tasks (${timestamp})"`);
  if (!commit.success) {
    console.error('   ✗ Failed to commit:', commit.error);
    return;
  }

  console.log('   ✓ Committed successfully');

  // Push
  console.log('   Pushing to GitHub...');
  const push = gitCommand('git push');
  if (!push.success) {
    console.error('   ✗ Failed to push:', push.error);
    return;
  }

  console.log('   ✓ Pushed successfully');
  console.log('   🎉 Auto-sync completed!\n');
}

// Pull changes from GitHub
function pullChanges() {
  console.log('\n📥 Pulling changes from GitHub...');

  // Check for local uncommitted changes first
  const status = gitCommand('git status --porcelain');
  if (status.success && status.output.trim()) {
    console.log('   ⚠ Local changes detected, skipping pull');
    console.log('   (Will commit and push first)\n');
    return;
  }

  // Pull with rebase
  const pull = gitCommand('git pull --rebase');
  if (!pull.success) {
    console.error('   ✗ Failed to pull:', pull.error);
    return;
  }

  // Reload file content
  try {
    lastFileContent = fs.readFileSync(FILE_PATH, 'utf-8');
    console.log('   ✓ Pulled successfully');
    console.log('   ✓ File content updated\n');
  } catch (err) {
    console.error('   ✗ Failed to reload file:', err.message);
  }
}

// Handle file change
function onFileChange() {
  try {
    const currentContent = fs.readFileSync(FILE_PATH, 'utf-8');

    // Check if content actually changed
    if (currentContent === lastFileContent) {
      return;
    }

    lastFileContent = currentContent;
    console.log('⚡ File changed, scheduling auto-commit in', DEBOUNCE_MS / 1000, 'seconds...');

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    debounceTimer = setTimeout(() => {
      commitAndPush();
      debounceTimer = null;
    }, DEBOUNCE_MS);

  } catch (err) {
    console.error('Error reading file:', err.message);
  }
}

// Start watching
function startWatching() {
  console.log('\n🔍 Starting file watcher...\n');

  // Watch file for changes
  fs.watch(FILE_PATH, { persistent: true }, (eventType, filename) => {
    if (eventType === 'change') {
      onFileChange();
    }
  });

  // Auto-pull periodically
  setInterval(() => {
    pullChanges();
  }, PULL_INTERVAL_MS);

  console.log('✓ File watcher started');
  console.log('✓ Press Ctrl+C to stop\n');
}

// Main
function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Task Manager - Auto-Sync Service     ║');
  console.log('╚════════════════════════════════════════╝\n');

  initialize();
  startWatching();
}

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping auto-sync service...');
  if (debounceTimer) {
    console.log('⚠ Pending changes will be committed now...');
    clearTimeout(debounceTimer);
    commitAndPush();
  }
  console.log('✓ Goodbye!\n');
  process.exit(0);
});

// Start
main();
