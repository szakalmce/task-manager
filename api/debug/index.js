module.exports = (req, res) => {
  // Show environment variables (but hide the token for security)
  res.status(200).json({
    GITHUB_OWNER: process.env.GITHUB_OWNER || 'NOT SET',
    GITHUB_REPO: process.env.GITHUB_REPO || 'NOT SET',
    GITHUB_FILE_PATH: process.env.GITHUB_FILE_PATH || 'NOT SET',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'SET (hidden)' : 'NOT SET',
    url: `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`
  });
};
