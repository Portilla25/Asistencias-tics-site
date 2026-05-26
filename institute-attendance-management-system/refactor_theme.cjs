const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const replacements = [
  // Backgrounds
  { regex: /\bbg-white\b/g, replace: 'bg-card' },
  { regex: /\bbg-gray-50\b/g, replace: 'bg-background' },
  { regex: /\bbg-gray-100\b/g, replace: 'bg-muted' },
  { regex: /\bbg-slate-50\b/g, replace: 'bg-background' },
  
  // Borders
  { regex: /\bborder-gray-100\b/g, replace: 'border-border' },
  { regex: /\bborder-gray-200\b/g, replace: 'border-border' },
  { regex: /\bborder-gray-300\b/g, replace: 'border-border' },
  { regex: /\bborder-slate-100\b/g, replace: 'border-border' },
  { regex: /\bborder-slate-200\b/g, replace: 'border-border' },
  
  // Text Foreground
  { regex: /\btext-gray-900\b/g, replace: 'text-foreground' },
  { regex: /\btext-gray-800\b/g, replace: 'text-foreground' },
  { regex: /\btext-slate-900\b/g, replace: 'text-foreground' },
  { regex: /\btext-slate-800\b/g, replace: 'text-foreground' },
  { regex: /\btext-gray-700\b/g, replace: 'text-foreground' },
  
  // Text Muted Foreground
  { regex: /\btext-gray-600\b/g, replace: 'text-muted-foreground' },
  { regex: /\btext-gray-500\b/g, replace: 'text-muted-foreground' },
  { regex: /\btext-gray-400\b/g, replace: 'text-muted-foreground' },
  { regex: /\btext-slate-500\b/g, replace: 'text-muted-foreground' },
  { regex: /\btext-slate-400\b/g, replace: 'text-muted-foreground' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const { regex, replace } of replacements) {
    newContent = newContent.replace(regex, replace);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  // Skip already refactored files
  if (['Header.tsx', 'Sidebar.tsx', 'TomarAsistencia.tsx'].includes(file)) continue;
  processFile(path.join(componentsDir, file));
}

// Also process Login
processFile(path.join(componentsDir, 'Login.tsx'));
