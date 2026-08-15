// Copia só os modelos que a gente usa (detector de rosto + malha + descritor)
// de node_modules/@vladmandic/human/models pra public/models, assim eles são
// servidos pelo nosso próprio domínio — sem depender de nenhum CDN externo
// pra funcionar no dia do casamento.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'node_modules', '@vladmandic', 'human', 'models');
const DEST = path.join(__dirname, '..', 'public', 'models');

const NEEDED = ['blazeface.json', 'blazeface.bin', 'facemesh.json', 'facemesh.bin', 'faceres.json', 'faceres.bin'];

if (!fs.existsSync(SRC)) {
  console.error('[copy-models] node_modules/@vladmandic/human/models não encontrado — rode "npm install" primeiro.');
  process.exit(1);
}
fs.mkdirSync(DEST, { recursive: true });

for (const file of NEEDED) {
  const from = path.join(SRC, file);
  const to = path.join(DEST, file);
  if (!fs.existsSync(from)) {
    console.error(`[copy-models] arquivo esperado não existe: ${from}`);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
}

console.log(`[copy-models] ${NEEDED.length} arquivos copiados pra public/models`);
