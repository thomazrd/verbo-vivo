import fs from 'fs/promises';
import path from 'path';

const RULES_DIR = 'rules';
const OUTPUT_FILE = 'firestore.rules';
const MAIN_RULES_FILE = 'main.rules';

async function buildRules() {
  try {
    const files = await fs.readdir(RULES_DIR);
    const mainRulesPath = path.join(RULES_DIR, MAIN_RULES_FILE);
    const mainContent = await fs.readFile(mainRulesPath, 'utf8');

    // Split main.rules at the placeholder
    const injectionPlaceholder = '// ===== INJECT_MODULE_RULES_HERE =====';
    const parts = mainContent.split(injectionPlaceholder);
    if (parts.length !== 2) {
      throw new Error(`Placeholder '${injectionPlaceholder}' not found or found multiple times in ${MAIN_RULES_FILE}`);
    }
    const [header, footer] = parts;

    let allRules = '';

    for (const file of files) {
      if (file !== MAIN_RULES_FILE && file.endsWith('.rules')) {
        const filePath = path.join(RULES_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        allRules += `\n    // From: ${file}\n    ${content.replace(/\n/g, '\n    ')}\n`; // Indent module rules
      }
    }

    // Assemble the final content
    const finalContent = `${header.trim()}\n${allRules}\n${footer.trim()}`;

    await fs.writeFile(OUTPUT_FILE, finalContent);
    console.log(`${OUTPUT_FILE} has been generated successfully.`);
  } catch (error) {
    console.error(`Error building rules file:`, error);
    process.exit(1);
  }
}

buildRules();
