document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.ano').forEach(el=>el.textContent=new Date().getFullYear());

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

    const imagem=card.querySelector('.catalogo-card__imagem');
    if(imagem){
      const extensoes=['webp','avif','jpg','jpeg','png','gif','bmp','svg'];
      const capaPadrao=imagem.dataset.capaPadrao;
      let indice=0;

      imagem.alt=`Capa do catálogo ${titulo||arquivo}`;
      const tentarProximaCapa=()=>{
        if(indice<extensoes.length){
          imagem.src=`pdf/capas/${encodeURIComponent(arquivo)}.${extensoes[indice++]}`;
          return;
        }
        imagem.removeEventListener('error',tentarProximaCapa);
        if(capaPadrao)imagem.src=capaPadrao;
      };

      imagem.addEventListener('error',tentarProximaCapa);
      tentarProximaCapa();
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
