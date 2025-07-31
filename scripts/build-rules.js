
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
    console.log('Gerando firestore.rules...');

    if (!fs.existsSync(baseFile)) {
        throw new Error(`Arquivo base não encontrado em ${baseFile}`);
    }

    let functionsContent = '';
    if (fs.existsSync(functionsDir)) {
        const functionFiles = fs.readdirSync(functionsDir).filter(f => f.endsWith('.rules'));
        for (const file of functionFiles) {
            const filePath = path.join(functionsDir, file);
            functionsContent += `// --- From: ${file} ---\n`;
            functionsContent += fs.readFileSync(filePath, 'utf8') + '\n\n';
        }
    }

    let rulesContent = '';
    if (fs.existsSync(collectionsDir)) {
        const collectionFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.rules'));
        
        for (const file of collectionFiles) {
            const filePath = path.join(collectionsDir, file);
            rulesContent += `    // From: ${file}\n`;
            rulesContent += '    ' + fs.readFileSync(filePath, 'utf8').split('\n').join('\n    ') + '\n\n';
        }
    }

    let finalContent = fs.readFileSync(baseFile, 'utf8')
      .replace('// {{FUNCTIONS_CONTENT}}', functionsContent)
      .replace('// {{RULES_CONTENT}}', rulesContent);
    
    fs.writeFileSync(outputFile, finalContent);

    console.log('✅ firestore.rules foi gerado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao gerar firestore.rules:', error);
  }
};

const watchMode = process.argv.includes('--watch');

if (watchMode) {
  console.log('👀 Observando alterações na pasta /rules...');
  const watcher = chokidar.watch(rulesDir, { ignored: outputFile, persistent: true });
  watcher.on('all', (event, filePath) => {
    if ((event === 'add' || event === 'change' || event === 'unlink') && filePath.endsWith('.rules')) {
        console.log(`[${event}] ${path.basename(filePath)}`);
        buildRules();
    }
  });
} else {
  buildRules();
}
