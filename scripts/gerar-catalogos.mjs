import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const pastaPdf = join(raiz, 'pdf');
const pastaPdfVigente = join(pastaPdf, 'vigente');
const pastaCapas = join(pastaPdf, 'capas');
const destino = join(raiz, 'js', 'catalogos.js');
const extensoesDeImagem = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

const chave = nome => nome.normalize('NFC').toLocaleLowerCase('pt-BR');
const semExtensao = nome => nome.slice(0, -extname(nome).length);

const [nomesPdf, nomesPdfVigentes, arquivosCapa] = await Promise.all([
  readdir(pastaPdf),
  readdir(pastaPdfVigente).catch(() => []),
  readdir(pastaCapas),
]);

const nomesPdfVigentesNormalizados = new Set(nomesPdfVigentes.map(chave));
const pdfsRaiz = nomesPdf
  .filter(nome => extname(nome).toLowerCase() === '.pdf')
  .filter(nome => !nomesPdfVigentesNormalizados.has(chave(nome)));
const pdfsVigentes = nomesPdfVigentes
  .filter(nome => extname(nome).toLowerCase() === '.pdf');
const pdfs = await Promise.all([
  ...pdfsRaiz.map(async nome => {
    const tamanho = (await stat(join(pastaPdf, nome))).size;
    return { nome, arquivo: nome, tamanho, status: tamanho === 0 ? 'embreve' : 'passado' };
  }),
  ...pdfsVigentes.map(async nome => {
    const tamanho = (await stat(join(pastaPdfVigente, nome))).size;
    return { nome, arquivo: `vigente/${nome}`, tamanho, status: 'atual' };
  })
]);
const capas = arquivosCapa.filter(nome => extensoesDeImagem.has(extname(nome).toLowerCase()));
const capaPorNome = new Map(capas.map(nome => [chave(semExtensao(nome)), nome]));

const catalogos = pdfs.map(({ nome, arquivo, tamanho, status }) => {
  const nomeCompleto = semExtensao(nome);
  const partes = nomeCompleto.match(/^(.*?)(?:\s+(\d{2}|\d{4}))?$/);
  const anoInformado = partes?.[2];
  const ano = anoInformado ? Number(anoInformado.length === 2 ? `20${anoInformado}` : anoInformado) : null;

  return {
    arquivo,
    capa: capaPorNome.get(chave(nomeCompleto)) || null,
    titulo: partes?.[1]?.trim() || nomeCompleto,
    ano,
    status
  };
});

catalogos.sort((a, b) => {
  const ordem = { atual: 0, embreve: 1, passado: 2 };
  if (a.status !== b.status) return ordem[a.status] - ordem[b.status];
  return a.titulo.localeCompare(b.titulo, 'pt-BR');
});

const aviso = '// Arquivo gerado automaticamente. PDFs em /pdf/vigente aparecem como vigentes; PDFs vazios em /pdf aparecem como em breve.\n';
const conteudoGerado = `${aviso}window.PETIT_BISCUIT_CATALOGOS = ${JSON.stringify(catalogos, null, 2)};\n`;
const versao = createHash('sha256').update(conteudoGerado).digest('hex').slice(0, 10);
await writeFile(destino, conteudoGerado, 'utf8');

for (const pagina of ['index.html', 'catalogo.html']) {
  const caminhoPagina = join(raiz, pagina);
  const html = await readFile(caminhoPagina, 'utf8');
  const htmlAtualizado = html.replace(/js\/catalogos\.js\?v=[^"']+/g, `js/catalogos.js?v=${versao}`);
  await writeFile(caminhoPagina, htmlAtualizado, 'utf8');
}

for (const item of catalogos.filter(item => item.status !== 'embreve' && !item.capa)) {
  console.warn(`Capa não encontrada para: ${item.arquivo}`);
}
console.log(`${catalogos.length} catálogo(s) incluído(s) em js/catalogos.js.`);
