
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
    let finalContent = fs.readFileSync(baseFile, 'utf8') + '\n\n';
    
    // Process functions
    if (fs.existsSync(functionsDir)) {
        const functionFiles = fs.readdirSync(functionsDir).filter(f => f.endsWith('.rules'));
        for (const file of functionFiles) {
            const filePath = path.join(functionsDir, file);
            finalContent += `// --- From: ${file} ---\n`;
            finalContent += fs.readFileSync(filePath, 'utf8') + '\n\n';
        }
    }

    finalContent += '    // --- Rules for collections ---\n';
    
    // Process collections
    if (fs.existsSync(collectionsDir)) {
        const collectionFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.rules'));
        
        for (const file of collectionFiles) {
            const filePath = path.join(collectionsDir, file);
            finalContent += `    // From: ${file}\n`;
            finalContent += fs.readFileSync(filePath, 'utf8').split('\n').map(line => `    ${line}`).join('\n') + '\n\n';
        }
    }

    finalContent += '  }\n}';
    
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
    if (event === 'add' || event === 'change' || event === 'unlink') {
        console.log(`[${event}] ${path.basename(filePath)}`);
        buildRules();
    }
  });
} else {
  buildRules();
}
