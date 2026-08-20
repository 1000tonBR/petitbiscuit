document.addEventListener('DOMContentLoaded',async()=>{
  document.querySelectorAll('.ano').forEach(el=>el.textContent=new Date().getFullYear());

  const catalogosLocais=window.PETIT_BISCUIT_CATALOGOS||[];
  const carregarCatalogosOnline=async()=>{
    if(location.protocol==='file:')return catalogosLocais;

    try{
      const api='https://api.github.com/repos/1000tonBR/petitbiscuit/contents';
      const [respostaPdf,respostaCapas]=await Promise.all([
        fetch(`${api}/pdf?ref=main`,{headers:{Accept:'application/vnd.github+json'}}),
        fetch(`${api}/pdf/capas?ref=main`,{headers:{Accept:'application/vnd.github+json'}})
      ]);
      if(!respostaPdf.ok||!respostaCapas.ok)throw new Error('Não foi possível consultar os catálogos.');

      const [arquivosPdf,arquivosCapa]=await Promise.all([respostaPdf.json(),respostaCapas.json()]);
      const extensoesImagem=/\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
      const chave=nome=>nome.normalize('NFC').toLocaleLowerCase('pt-BR');
      const semExtensao=nome=>nome.replace(/\.[^.]+$/,'');
      const capas=new Map(
        arquivosCapa
          .filter(item=>item.type==='file'&&extensoesImagem.test(item.name))
          .map(item=>[chave(semExtensao(item.name)),item.name])
      );
      const locais=new Map(catalogosLocais.map(item=>[chave(item.arquivo),item]));
      const remotos=arquivosPdf
        .filter(item=>item.type==='file'&&/\.pdf$/i.test(item.name))
        .map(item=>{
          const nomeCompleto=semExtensao(item.name);
          const partes=nomeCompleto.match(/^(.*?)(?:\s+(\d{2}|\d{4}))?$/);
          const anoInformado=partes?.[2];
          const ano=anoInformado?Number(anoInformado.length===2?`20${anoInformado}`:anoInformado):null;
          return {
            arquivo:item.name,
            capa:capas.get(chave(nomeCompleto))||null,
            titulo:partes?.[1]?.trim()||nomeCompleto,
            ano,
            status:item.size===0?'embreve':locais.get(chave(item.name))?.status==='atual'?'atual':'passado',
            novo:item.size>0&&!locais.has(chave(item.name))
          };
        });

      const novos=remotos.filter(item=>item.novo).sort((a,b)=>a.arquivo.localeCompare(b.arquivo,'pt-BR'));
      if(novos.length){
        remotos.forEach(item=>{if(item.status!=='embreve')item.status='passado';});
        novos.at(-1).status='atual';
      }else if(!remotos.some(item=>item.status==='atual')){
        const primeiroDisponivel=remotos.find(item=>item.status!=='embreve');
        if(primeiroDisponivel)primeiroDisponivel.status='atual';
      }
      remotos.forEach(item=>{delete item.novo;});
      const ordem={atual:0,embreve:1,passado:2};
      return remotos.sort((a,b)=>a.status!==b.status?ordem[a.status]-ordem[b.status]:a.titulo.localeCompare(b.titulo,'pt-BR'));
    }catch(erro){
      console.warn(erro.message);
      return catalogosLocais;
    }
  };

  const catalogos=await carregarCatalogosOnline();

  const caminhoArquivo=(pasta,nome)=>`${pasta}/${encodeURIComponent(nome)}`;
  const criarCardCatalogo=catalogo=>{
    const atual=catalogo.status==='atual';
    const emBreve=catalogo.status==='embreve';
    const card=document.createElement(emBreve?'article':'a');
    const classeEstado=emBreve?'catalogo-card--embreve':atual?'catalogo-card--atual':'catalogo-card--passado';
    card.className=`catalogo-card ${classeEstado}${catalogo.capa?' catalogo-card--com-capa':' catalogo-card--sem-capa'}`;
    if(!emBreve){
      card.href=caminhoArquivo('pdf',catalogo.arquivo);
      card.target='_blank';
      card.rel='noopener';
    }

    if(catalogo.capa){
      const imagem=document.createElement('img');
      imagem.className='catalogo-card__imagem';
      imagem.src=caminhoArquivo('pdf/capas',catalogo.capa);
      imagem.alt=`Capa do catálogo ${catalogo.titulo}`;
      imagem.loading='lazy';
      card.appendChild(imagem);
    }

    if(atual||emBreve){
      const tag=document.createElement('span');
      tag.className=`catalogo-card__tag${atual?' catalogo-card__tag--novo':''}`;
      tag.textContent=atual?'Novo':'Em breve';
      card.appendChild(tag);
    }

    if(catalogo.ano){
      const ano=document.createElement('span');
      ano.className='catalogo-card__ano';
      ano.textContent=catalogo.ano;
      card.appendChild(ano);
    }

    const conteudo=document.createElement('div');
    conteudo.className='catalogo-card__conteudo';
    const descricao=emBreve?'Novidade a caminho':atual?'Coleção vigente':'Coleção encerrada';
    const acao=emBreve?'Lançamento em breve':atual?'Abrir catálogo':'Rever catálogo';
    conteudo.innerHTML=`<small>${descricao}</small><h3></h3><span class="catalogo-card__acao">${acao} <b aria-hidden="true">→</b></span>`;
    conteudo.querySelector('h3').textContent=catalogo.titulo;
    card.appendChild(conteudo);
    return card;
  };

  document.querySelectorAll('[data-catalogos]').forEach(lista=>{
    const status=lista.dataset.catalogos;
    catalogos
      .filter(catalogo=>catalogo.status===status)
      .forEach(catalogo=>lista.appendChild(criarCardCatalogo(catalogo)));
  });

  document.querySelectorAll('a.catalogo-card[href*=".pdf"]').forEach(card=>{
    const arquivo=decodeURIComponent(card.getAttribute('href').split('/').pop()).replace(/\.pdf$/i,'');
    const partes=arquivo.match(/^(.*?)(?:\s+(\d{2}))?$/);
    const titulo=partes?.[1]?.trim();
    const anoCurto=partes?.[2];
    const tituloCard=card.querySelector('h3');

    if(titulo&&tituloCard)tituloCard.textContent=titulo;

    if(anoCurto){
      let anoCard=card.querySelector('.catalogo-card__ano');
      if(!anoCard){
        anoCard=document.createElement('span');
        anoCard.className='catalogo-card__ano';
        card.appendChild(anoCard);
      }
      anoCard.textContent=`20${anoCurto}`;
    }

  });

  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('nav');
  if(menu&&nav)menu.addEventListener('click',()=>{const aberto=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!aberto));});
  const abrir=document.querySelector('.contato-toggle'),modal=document.querySelector('.contato-modal');
  if(abrir&&modal){
    const fechar=()=>{modal.hidden=true;abrir.setAttribute('aria-expanded','false');abrir.focus();};
    abrir.addEventListener('click',()=>{modal.hidden=false;abrir.setAttribute('aria-expanded','true');modal.querySelector('.contato-modal__fechar').focus();});
    modal.querySelectorAll('[data-fechar-contato]').forEach(el=>el.addEventListener('click',fechar));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)fechar();});
  }

  const musica=document.querySelector('#musica-player'),botaoMusica=document.querySelector('#musica-toggle');
  if(musica&&botaoMusica){
    const atualizarBotao=ativa=>{
      botaoMusica.setAttribute('aria-pressed',String(ativa));
      botaoMusica.textContent=ativa?'❚❚ Pausar música':'♪ Ativar música';
    };
    musica.play().then(()=>atualizarBotao(true)).catch(()=>atualizarBotao(false));
    botaoMusica.addEventListener('click',()=>{
      if(musica.paused){
        musica.play().then(()=>atualizarBotao(true)).catch(()=>atualizarBotao(false));
      }else{
        musica.pause();
        atualizarBotao(false);
      }
    });
  }
});
