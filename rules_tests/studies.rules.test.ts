
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore Security Rules for Studies Module', () => {
  let rulesContent: string;

  beforeAll(() => {
    // Carrega o conteúdo do arquivo de regras do Firestore uma vez para todos os testes.
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    rulesContent = fs.readFileSync(rulesPath, 'utf8');
  });

  it('deve permitir leitura pública para estudos publicados', () => {
    // Esta expressão regular verifica a regra:
    // allow read: if resource.data.status == 'PUBLISHED'
    const publicReadRule = /match \/studies\/{studyId} {[\s\S]*?allow read: if resource\.data\.status == 'PUBLISHED'/;
    expect(rulesContent).toMatch(publicReadRule);
  });

  it('deve permitir que administradores leiam e escrevam em qualquer estudo', () => {
    // Verifica a regra de leitura para administradores
    const adminReadRule = /match \/studies\/{studyId} {[\s\S]*?allow read: if .*?isUserAdmin\(\);?/;
    expect(rulesContent).toMatch(adminReadRule);
    
    // Verifica a regra de escrita para administradores
    const adminWriteRule = /match \/studies\/{studyId} {[\s\S]*?allow write: if isUserAdmin\(\);?/;
    expect(rulesContent).toMatch(adminWriteRule);
  });

  it('deve conter a função de verificação de administrador (isUserAdmin)', () => {
    // Garante que a função auxiliar que dá suporte às regras de admin exista.
    const adminFunctionRule = /function isUserAdmin\(\) {[\s\S]*?return isUserAuthenticated\(\) && get\(\/databases\/\$\(database\)\/documents\/users\/\$\(request\.auth\.uid\)\)\.data\.role == 'ADMIN';[\s\S]*?}/;
    expect(rulesContent).toMatch(adminFunctionRule);
  });
});
