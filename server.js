require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// GitHub configuration from environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH;

app.use(express.json());
app.use(express.static(__dirname));

// Get tasks from GitHub
app.get('/api/tasks', async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Task-Manager-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    res.json({
      content,
      sha: data.sha // Needed for updates
    });
  } catch (error) {
    console.error('Error fetching from GitHub:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save tasks to GitHub
app.post('/api/tasks', async (req, res) => {
  try {
    const { content, sha } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

    // First, get the current file SHA if not provided
    let fileSha = sha;
    if (!fileSha) {
      const getResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Task-Manager-App'
        }
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        fileSha = getData.sha;
      }
    }

    // Update the file
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Task-Manager-App'
      },
      body: JSON.stringify({
        message: 'Update tasks from Task Manager',
        content: Buffer.from(content, 'utf-8').toString('base64'),
        sha: fileSha
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      sha: data.content.sha
    });
  } catch (error) {
    console.error('Error saving to GitHub:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Task Manager running at http://localhost:${PORT}`);
  console.log(`Connected to GitHub repo: ${GITHUB_OWNER}/${GITHUB_REPO}`);
});
