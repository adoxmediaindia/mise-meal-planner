const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Check if git status has any secret files staged or tracked
console.log('--- SCANNING GIT TRACKED AND UNTRACKED FILES FOR SECRETS ---');

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const untrackedFiles = execSync('git status -s', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .map((line) => line.trim().split(' ').pop());

const allFilesToCheck = Array.from(new Set([...trackedFiles, ...untrackedFiles])).filter(
  (f) =>
    !f.includes('node_modules') &&
    !f.includes('dist/') &&
    !f.endsWith('.png') &&
    !f.endsWith('.jpg') &&
    !f.endsWith('.jpeg') &&
    !f.endsWith('.ico') &&
    !f.endsWith('.lock')
);

const secretPatterns = [
  { name: 'MongoDB with password', regex: /mongodb(\+srv)?:\/\/[^\/\s@:]+:(?!<password>|\*\*\*)[^\/\s@]+@[^\/\s]+/i },
  { name: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP|PRIVATE) KEY/ },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Stripe Secret Key', regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/ },
  { name: 'GitHub Token', regex: /gh[pousr]_[0-9a-zA-Z]{36,}/ },
  { name: 'Bearer Token Hardcoded', regex: /bearer\s+[a-zA-Z0-9_\-\.]{40,}/i },
];

let findings = [];

// Check if any .env file is tracked
trackedFiles.forEach((file) => {
  if (path.basename(file) === '.env' || (path.basename(file).startsWith('.env.') && !file.endsWith('.example'))) {
    findings.push({ file, type: 'Tracked .env file' });
  }
});

allFilesToCheck.forEach((relPath) => {
  if (!fs.existsSync(relPath)) return;
  const stat = fs.statSync(relPath);
  if (stat.isDirectory()) return;

  const content = fs.readFileSync(relPath, 'utf8');
  secretPatterns.forEach(({ name, regex }) => {
    if (regex.test(content)) {
      findings.push({ file: relPath, type: name });
    }
  });
});

console.log('Scan completed.');
if (findings.length === 0) {
  console.log('✅ ZERO SECRETS DETECTED. Repository is clean and safe to push.');
} else {
  console.log('❌ Potential secrets found:');
  findings.forEach((f) => console.log(`  - [${f.type}] in ${f.file}`));
}
