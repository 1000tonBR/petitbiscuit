/*=========================================================
PETIT BISCUIT
script.js
=========================================================*/

/*==========================
MENU MOBILE
==========================*/

const menuButton = document.querySelector("#menu-mobile");
const nav = document.querySelector("#nav");

menuButton.addEventListener("click", () => {

    nav.classList.toggle("active");

    if(nav.classList.contains("active")){

        menuButton.innerHTML = "✕";

    }else{

        menuButton.innerHTML = "☰";

    }

});

/*==========================
FECHAR MENU AO CLICAR
==========================*/

document.querySelectorAll("#nav a").forEach(link=>{

    link.addEventListener("click",()=>{

        nav.classList.remove("active");

        menuButton.innerHTML="☰";

    });

});

/*==========================
HEADER SCROLL
==========================*/

const header=document.querySelector("#header");

window.addEventListener("scroll",()=>{

    if(window.scrollY>80){

        header.classList.add("scrolled");

    }else{

        header.classList.remove("scrolled");

    }

});

/*==========================
SCROLL SUAVE
==========================*/

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

    anchor.addEventListener("click",function(e){

        e.preventDefault();

        const destino=document.querySelector(this.getAttribute("href"));

        if(destino){

            destino.scrollIntoView({

                behavior:"smooth"

            });

        }

    });

});

/*==========================
FADE AO ROLAR
==========================*/

const elementos=document.querySelectorAll(".fade");

const observer=new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("show");

        }

    });

},{

    threshold:.15

});

elementos.forEach(el=>observer.observe(el));

/*==========================
MENU ATIVO
==========================*/

const secoes=document.querySelectorAll("section");

const links=document.querySelectorAll("nav a");

window.addEventListener("scroll",()=>{

    let atual="";

    secoes.forEach(sec=>{

        const top=window.scrollY;

        const offset=sec.offsetTop-150;

        const altura=sec.offsetHeight;

        if(top>=offset && top<offset+altura){

            atual=sec.getAttribute("id");

        }

    });

    links.forEach(link=>{

        link.classList.remove("active");

        if(link.getAttribute("href")==="#"+atual){

            link.classList.add("active");

        }

    });

});

/*==========================
BOTÃO VOLTAR TOPO
==========================*/

const voltar=document.createElement("button");

voltar.innerHTML="↑";

voltar.className="topButton";

document.body.appendChild(voltar);

window.addEventListener("scroll",()=>{

    voltar.style.opacity=window.scrollY>500?1:0;

});

voltar.addEventListener("click",()=>{

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

/*==========================
PDF MOBILE
==========================*/

const iframe=document.querySelector(".catalogo iframe");

if(iframe){

    const mobile=window.innerWidth<768;

    if(mobile){

        iframe.style.height="520px";

    }

}

/*==========================
ANO AUTOMÁTICO
==========================*/

const footer=document.querySelector("footer");

if(footer){

    const ano=new Date().getFullYear();

    footer.innerHTML=footer.innerHTML.replace("2026",ano);

}

/*==========================
PRELOAD
==========================*/

window.addEventListener("load",()=>{

    document.body.classList.add("loaded");

});

console.log("Petit Biscuit ✓");