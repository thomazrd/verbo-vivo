import * as fs from 'fs';
import * as path from 'path';

describe('Firestore Security Rules for Chat Module', () => {
  let rulesContent: string;

  beforeAll(() => {
    // Carrega o conteúdo do arquivo de regras do Firestore.
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    rulesContent = fs.readFileSync(rulesPath, 'utf8');
  });

  it('should allow a user to read their own messages', () => {
    // Esta expressão regular verifica a regra:
    // match /users/{userId}/messages/{messageId} {
    //   allow read: if isUserAuthenticated() && request.auth.uid == userId;
    // }
    const regex = /match\s+\/users\/{userId}\/messages\/{messageId}\s*{[\s\S]*?allow\s+read\s*:\s*if\s+isUserAuthenticated\(\)\s+&&\s+request\.auth\.uid\s+==\s+userId\s*;/;
    expect(rulesContent).toMatch(regex);
  });

  it('should allow a user to write to their own messages', () => {
    // Esta expressão regular verifica a regra:
    // match /users/{userId}/messages/{messageId} {
    //   allow write: if isUserAuthenticated() && request.auth.uid == userId;
    // }
    const regex = /match\s+\/users\/{userId}\/messages\/{messageId}\s*{[\s\S]*?allow\s+write\s*:\s*if\s+isUserAuthenticated\(\)\s+&&\s+request\.auth\.uid\s+==\s+userId\s*;/;
    expect(rulesContent).toMatch(regex);
  });

  it('should NOT allow a user to read another user\'s messages', () => {
    // Esta é uma verificação implícita. A regra `request.auth.uid == userId`
    // garante que um usuário não possa acessar a subcoleção de outro.
    // O teste aqui é garantir que não haja uma regra mais ampla que permita isso.
    const broadReadRule = /match\s+\/users\/{userId}\/messages\/{messageId}\s*{[\s\S]*?allow\s+read\s*:\s*if\s+isUserAuthenticated\(\)\s*;/;
    // We expect NOT to find a rule that only checks for authentication without checking the userId.
    expect(rulesContent).not.toMatch(broadReadRule);
  });

  it('should NOT allow a user to write to another user\'s messages', () => {
    // Similar to the read rule, we ensure there's no broad write access.
    const broadWriteRule = /match\s+\/users\/{userId}\/messages\/{messageId}\s*{[\s\S]*?allow\s+write\s*:\s*if\s+isUserAuthenticated\(\)\s*;/;
    expect(rulesContent).not.toMatch(broadWriteRule);
  });
});
