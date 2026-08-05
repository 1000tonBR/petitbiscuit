document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.ano').forEach(el=>el.textContent=new Date().getFullYear());
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
