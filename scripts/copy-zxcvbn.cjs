const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'zxcvbn', 'dist', 'zxcvbn.js');
const dest = path.join(__dirname, '..', 'zxcvbn.js');

function exit(msg, code) {
  console[code === 0 ? 'log' : 'error'](msg);
  process.exit(code);
}

fs.stat(src, (err) => {
  if (err) return exit(`zxcvbn source not found at: ${src}`, 1);
  fs.copyFile(src, dest, (err2) => {
    if (err2) return exit(`Failed to copy zxcvbn.js: ${err2.message}`, 1);
    exit('Copied zxcvbn.js to project root.', 0);
  });
});
