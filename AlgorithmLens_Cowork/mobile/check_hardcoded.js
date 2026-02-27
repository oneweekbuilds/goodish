const fs = require('fs');

const files = ['app/(tabs)/settings.tsx', 'app/(tabs)/history.tsx'];
const patterns = [
  { name: 'fontSize', regex: /fontSize:\s*(\d+)(?![\w%])/g },
  { name: 'borderRadius', regex: /borderRadius:\s*(\d+)(?![\w%])/g },
  { name: 'padding', regex: /padding(?:Horizontal|Vertical|Top|Bottom|Left|Right):\s*(\d+)(?![\w%])/g },
  { name: 'margin', regex: /margin(?:Horizontal|Vertical|Top|Bottom|Left|Right):\s*(\d+)(?![\w%])/g },
  { name: 'gap', regex: /gap:\s*(\d+)(?![\w%])/g },
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`\n=== ${file} ===\n`);
  let found = false;
  
  lines.forEach((line, idx) => {
    patterns.forEach(({ name, regex }) => {
      const matches = [...line.matchAll(regex)];
      matches.forEach(match => {
        const value = match[1];
        // Skip certain patterns (circular indicators, dividers, etc)
        if (name === 'borderRadius' && ['3', '4', '32'].includes(value)) {
          return;
        }
        if (name === 'gap' && value === '3') {
          return;
        }
        if (name === 'height' && value === '1') {
          return;
        }
        if (name === 'height' && value === '4') {
          return;
        }
        
        console.log(`Line ${idx + 1}: ${name}=${value}`);
        console.log(`  > ${line.trim().substring(0, 80)}`);
        found = true;
      });
    });
  });
  
  if (!found) {
    console.log('No additional hardcoded values found.');
  }
});
