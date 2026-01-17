// Vercel Serverless Function for GitHub API operations

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GitHub configuration from environment variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

  try {
    if (req.method === 'GET') {
      // Get tasks from GitHub
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Task-Manager-App'
        }
      });

      console.log('GitHub API response status:', response.status);
      console.log('GitHub API response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('GitHub API error response:', errorText);
        throw new Error(`GitHub API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('GitHub API data keys:', Object.keys(data));
      console.log('GitHub API data.content exists?', !!data.content);
      console.log('GitHub API data.content type:', typeof data.content);

      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return res.status(200).json({
        content,
        sha: data.sha
      });
    }
    else if (req.method === 'POST') {
      // Save tasks to GitHub
      console.log('POST request received');
      console.log('req.body:', req.body);
      console.log('req.body type:', typeof req.body);

      const { content, sha } = req.body;

      console.log('content exists?', !!content);
      console.log('content length:', content?.length);
      console.log('sha exists?', !!sha);

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

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
      return res.status(200).json({
        success: true,
        sha: data.content.sha
      });
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
