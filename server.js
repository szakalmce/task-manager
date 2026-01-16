const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const MARKDOWN_PATH = '/Users/tomasz_garbarz/2026/codzienne-działania.md';

app.use(express.json());
app.use(express.static(__dirname));

// Get tasks from markdown file
app.get('/api/tasks', async (req, res) => {
  try {
    const content = await fs.readFile(MARKDOWN_PATH, 'utf-8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save tasks to markdown file
app.post('/api/tasks', async (req, res) => {
  try {
    await fs.writeFile(MARKDOWN_PATH, req.body.content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Task Manager running at http://localhost:${PORT}`);
});
