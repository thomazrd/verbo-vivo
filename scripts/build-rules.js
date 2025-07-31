const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const rulesDir = path.join(__dirname, '..', 'rules');
const functionsDir = path.join(rulesDir, 'functions');
const collectionsDir = path.join(rulesDir, 'collections');
const outputFile = path.join(__dirname, '..', 'firestore.rules');

const buildRules = () => {
  try {
    const parts = [];

    // 1. Add the header
    parts.push("rules_version = '2';");
    parts.push("service cloud.firestore {");
    parts.push("  match /databases/{database}/documents {");

    // 2. Add all function files
    const functionFiles = fs.readdirSync(functionsDir).filter(f => f.endsWith('.rules'));
    for (const file of functionFiles) {
      parts.push(`    // --- From: ${file} ---`);
      parts.push(fs.readFileSync(path.join(functionsDir, file), 'utf8'));
    }

    // 3. Add all collection rule files
    const collectionFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.rules'));
    for (const file of collectionFiles) {
      parts.push(`    // From: ${file}`);
      parts.push(fs.readFileSync(path.join(collectionsDir, file), 'utf8'));
    }
    
    // 4. Add the closing braces
    parts.push("  }");
    parts.push("}");

    // 5. Join and write to file
    fs.writeFileSync(outputFile, parts.join('\n\n'));
    console.log(`✅ firestore.rules generated successfully at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error('❌ Error generating firestore.rules:', error);
    process.exit(1);
  }
};

// --- Execution Logic ---
const shouldWatch = process.argv.includes('--watch');

// Always build once on execution
buildRules();

if (shouldWatch) {
  console.log('👀 Watching for changes in .rules files...');
  const watcher = chokidar.watch(path.join(rulesDir, '**/*.rules'), {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', (event, filePath) => {
    console.log(`\nFile ${path.basename(filePath)} changed. Rebuilding...`);
    buildRules();
  });
}
