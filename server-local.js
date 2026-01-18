// Local development server for Task Manager
// Serves static files and provides /api/tasks endpoint using local file

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Path to local file (symlink to main directory)
const TASKS_FILE = path.join(__dirname, 'codzienne-dzialania.md');

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// API endpoint - GET tasks
app.get('/api/tasks', (req, res) => {
  try {
    const content = fs.readFileSync(TASKS_FILE, 'utf-8');

    // Return same format as GitHub API for compatibility
    res.json({
      content: content,
      sha: 'local-' + Date.now() // Fake SHA for local development
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint - POST tasks (save)
app.post('/api/tasks', (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Write to local file
    fs.writeFileSync(TASKS_FILE, content, 'utf-8');

    console.log('✓ Tasks saved to local file');

    // Return same format as GitHub API
    res.json({
      success: true,
      sha: 'local-' + Date.now()
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Task Manager - Local Development    ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`✓ Server running at: http://localhost:${PORT}`);
  console.log(`✓ Tasks file: ${TASKS_FILE}`);
  console.log(`✓ API endpoint: http://localhost:${PORT}/api/tasks`);
  console.log('\n📝 Open http://localhost:3000 in your browser');
  console.log('🛑 Press Ctrl+C to stop\n');
});
