// scripts/reset-project.js
const fs = require('fs');
const path = require('path');

// Directories to clean
const directoriesToReset = [
  path.join(__dirname, '..', 'app', '(tabs)'),
  path.join(__dirname, '..', 'app', 'auth'),
  path.join(__dirname, '..', 'app', 'context'),
  path.join(__dirname, '..', 'config')
];

// Ensure directories exist
directoriesToReset.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    // Clean directory
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${filePath}`);
      }
    });
  }
});

console.log('Project reset completed. You can now rebuild the project structure.');