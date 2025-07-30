
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const rulesDir = path.join(__dirname, '../rules');
const baseFile = path.join(rulesDir, 'firestore.rules.base');
const outputFile = path.join(__dirname, '../firestore.rules');
const collectionsDir = path.join(rulesDir, 'collections');
const functionsDir = path.join(rulesDir, 'functions');

const buildRules = () => {
  try {
    const baseContent = fs.readFileSync(baseFile, 'utf8');
    
    let rulesContent = '';

    // Read functions first
    const functionFiles = fs.readdirSync(functionsDir).filter(f => f.endsWith('.rules'));
    for (const file of functionFiles) {
        rulesContent += fs.readFileSync(path.join(functionsDir, file), 'utf8') + '\n\n';
    }

    // Read collection rules
    const collectionFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.rules'));
    for (const file of collectionFiles) {
        rulesContent += fs.readFileSync(path.join(collectionsDir, file), 'utf8') + '\n\n';
    }

    const finalContent = baseContent.replace('// {{RULES_CONTENT}}', rulesContent.trim());
    fs.writeFileSync(outputFile, finalContent);

    console.log('✅ firestore.rules foi gerado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao gerar firestore.rules:', error);
  }
};

const watchMode = process.argv.includes('--watch');

if (watchMode) {
  console.log('👀 Observando alterações na pasta /rules...');
  chokidar.watch(rulesDir, { ignored: outputFile }).on('all', (event, path) => {
    console.log(`[${event}] ${path}`);
    buildRules();
  });
} else {
  buildRules();
}
