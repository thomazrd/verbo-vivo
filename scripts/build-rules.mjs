// scripts/build-rules.mjs
import fs from 'fs/promises';
import path from 'path';

const rulesDir = path.resolve(process.cwd(), 'rules');
const outputFile = path.resolve(process.cwd(), 'firestore.rules');

async function buildRules() {
  try {
    console.log('Starting Firestore rules build...');

    const files = await fs.readdir(rulesDir);
    const ruleFiles = files
      .filter(file => file.endsWith('.rules'))
      .sort(); // Sort alphabetically to ensure a consistent order

    let combinedContent = '';

    for (const file of ruleFiles) {
      const filePath = path.join(rulesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`- Appending ${file}`);
      combinedContent += content + '\n\n';
    }

    await fs.writeFile(outputFile, combinedContent);
    console.log(`✅ Firestore rules successfully built at ${outputFile}`);

  } catch (error) {
    console.error('❌ Error building Firestore rules:', error);
    process.exit(1);
  }
}

buildRules();
