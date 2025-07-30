const fs = require('fs');
const path = require('path');

const rulesDir = path.join(__dirname, 'firestore', 'rules');
const mainFile = path.join(rulesDir, 'main.rules');
const outputFile = path.join(__dirname, 'firestore.rules');

let rulesContent = '';

// Define the order in which the files should be concatenated
const orderedFiles = [
  'helpers.rules',
  'users.rules',
  'studies.rules',
  'community.rules',
  'chat.rules',
  'sharedContent.rules',
  'general.rules'
];

// Read and concatenate the files in the specified order
orderedFiles.forEach(file => {
  const filePath = path.join(rulesDir, file);
  if (fs.existsSync(filePath)) {
    rulesContent += fs.readFileSync(filePath, 'utf8') + '\\n\\n';
  }
});

// Read the main file
const mainContent = fs.readFileSync(mainFile, 'utf8');

// Replace the placeholder with the concatenated rules
const finalContent = mainContent.replace('// ===== INJECT_MODULE_RULES_HERE =====', rulesContent);

// Write the final content to the output file
fs.writeFileSync(outputFile, finalContent);

console.log('Firestore rules built successfully!');
