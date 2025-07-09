const express = require('express');
const path = require('path');

// Create Express app for serving static files
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from website directory
app.use(express.static(path.join(__dirname, 'website')));

// Start web server
app.listen(PORT, () => {
    console.log(`Website server running on port ${PORT}`);
});

// Export the app for use in index.js
module.exports = app;
