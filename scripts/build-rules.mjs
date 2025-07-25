#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const RULES_DIR = 'rules';
const MAIN_RULES_FILE = 'main.rules';
const OUTPUT_FILE = 'firestore.rules';

async function buildRules() {
  try {
    const files = await fs.readdir(RULES_DIR);
    
    // 1. Read the main skeleton file
    const mainRulesContent = await fs.readFile(path.join(RULES_DIR, MAIN_RULES_FILE), 'utf-8');
    
    // 2. Read all other modular rule files
    const rulePromises = files
      .filter(file => file !== MAIN_RULES_FILE && file.endsWith('.rules'))
      .map(file => fs.readFile(path.join(RULES_DIR, file), 'utf-8'));
      
    const modularRules = await Promise.all(rulePromises);
    
    // 3. Inject the modular rules into the placeholder
    const finalRules = mainRulesContent.replace(
      '// {{all_rules}}',
      modularRules.join('\n\n')
    );
    
    // 4. Write the final combined file
    await fs.writeFile(OUTPUT_FILE, finalRules);
    
    console.log(`✅ Successfully built ${OUTPUT_FILE} from modular rules.`);
    
  } catch (error) {
    console.error('❌ Error building firestore.rules:', error);
    process.exit(1);
  }
}

buildRules();
