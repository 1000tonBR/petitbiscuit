/*==================================================
PETIT BISCUIT
script.js
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    /*==========================================
    Atualiza automaticamente o ano do rodapé
    ==========================================*/

    const anoAtual = new Date().getFullYear();

    document.querySelectorAll(".ano").forEach(item => {
        item.textContent = anoAtual;
    });

    /*==========================================
    Header com sombra ao rolar
    ==========================================*/

    const header = document.querySelector("header");

    function atualizarHeader(){

        if(window.scrollY > 15){

            header.classList.add("scroll");

        }else{

            header.classList.remove("scroll");

        }

    }

    atualizarHeader();

    window.addEventListener("scroll", atualizarHeader);

});