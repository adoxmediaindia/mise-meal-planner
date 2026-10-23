const fs = require('fs');

const html = fs.readFileSync('reference/reference_index.html', 'utf8');
const lines = html.split('\n');

console.log('--- SECTIONS IN REFERENCE INDEX ---');
lines.forEach((line, i) => {
  if (line.includes('<section') || line.includes('class="nav"') || line.includes('<footer')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
