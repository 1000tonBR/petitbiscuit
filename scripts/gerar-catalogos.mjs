import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const pastaPdf = join(raiz, 'pdf');
const pastaCapas = join(pastaPdf, 'capas');
const destino = join(raiz, 'js', 'catalogos.js');
const extensoesDeImagem = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const argumentoAtual = process.argv.indexOf('--atual');
const arquivoAtualInformado = argumentoAtual >= 0 ? process.argv[argumentoAtual + 1] : null;
const promoverNovos = process.argv.includes('--promover-novos');

const chave = nome => nome.normalize('NFC').toLocaleLowerCase('pt-BR');
const semExtensao = nome => nome.slice(0, -extname(nome).length);

async function lerManifestoExistente() {
  try {
    const conteudo = await readFile(destino, 'utf8');
    const inicio = conteudo.indexOf('[');
    const fim = conteudo.lastIndexOf(']');
    return inicio >= 0 && fim > inicio ? JSON.parse(conteudo.slice(inicio, fim + 1)) : [];
  } catch {
    return [];
  }
}

const [nomesPdf, arquivosCapa, catalogosAnteriores] = await Promise.all([
  readdir(pastaPdf),
  readdir(pastaCapas),
  lerManifestoExistente()
]);

const pdfs = await Promise.all(
  nomesPdf
    .filter(nome => extname(nome).toLowerCase() === '.pdf')
    .map(async nome => ({ nome, tamanho: (await stat(join(pastaPdf, nome))).size }))
);
const capas = arquivosCapa.filter(nome => extensoesDeImagem.has(extname(nome).toLowerCase()));
const capaPorNome = new Map(capas.map(nome => [chave(semExtensao(nome)), nome]));
const anteriorPorArquivo = new Map(catalogosAnteriores.map(item => [chave(item.arquivo), item]));
const arquivosNovos = new Set(
  pdfs
    .filter(item => item.tamanho > 0 && !anteriorPorArquivo.has(chave(item.nome)))
    .map(item => chave(item.nome))
);

const catalogos = pdfs.map(({ nome: arquivo, tamanho }) => {
  const nomeCompleto = semExtensao(arquivo);
  const partes = nomeCompleto.match(/^(.*?)(?:\s+(\d{2}|\d{4}))?$/);
  const anoInformado = partes?.[2];
  const ano = anoInformado ? Number(anoInformado.length === 2 ? `20${anoInformado}` : anoInformado) : null;
  const anterior = anteriorPorArquivo.get(chave(arquivo));

  return {
    arquivo,
    capa: capaPorNome.get(chave(nomeCompleto)) || null,
    titulo: partes?.[1]?.trim() || nomeCompleto,
    ano,
    status: tamanho === 0 ? 'embreve' : anterior?.status === 'atual' ? 'atual' : 'passado'
  };
});

if (arquivoAtualInformado) {
  catalogos.forEach(item => {
    if(item.status !== 'embreve')item.status = chave(item.arquivo) === chave(arquivoAtualInformado) ? 'atual' : 'passado';
  });
} else if (promoverNovos && arquivosNovos.size) {
  const novos = catalogos
    .filter(item => arquivosNovos.has(chave(item.arquivo)))
    .sort((a, b) => a.arquivo.localeCompare(b.arquivo, 'pt-BR'));
  catalogos.forEach(item => { if(item.status !== 'embreve')item.status = 'passado'; });
  novos.at(-1).status = 'atual';
} else if (!catalogos.some(item => item.status === 'atual')) {
  const primeiroDisponivel = catalogos.find(item => item.status !== 'embreve');
  if(primeiroDisponivel)primeiroDisponivel.status = 'atual';
}

catalogos.sort((a, b) => {
  const ordem = { atual: 0, embreve: 1, passado: 2 };
  if (a.status !== b.status) return ordem[a.status] - ordem[b.status];
  return a.titulo.localeCompare(b.titulo, 'pt-BR');
});

const aviso = '// Arquivo gerado automaticamente. Adicione PDFs em /pdf e capas homônimas em /pdf/capas.\n';
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
