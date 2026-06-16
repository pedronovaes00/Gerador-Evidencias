// Script para controlar o comportamento do botão de ação flutuante (FAB)

document.addEventListener('DOMContentLoaded', function() {
    const fabButton = document.querySelector('.fab-button');
    const fabOptions = document.querySelector('.fab-options');
    
    // Adicionar evento de clique ao botão principal
    fabButton.addEventListener('click', function() {
        fabButton.classList.toggle('active');
        fabOptions.classList.toggle('active');
    });
    
    // Fechar o menu quando clicar fora dele
    document.addEventListener('click', function(event) {
        const isClickInside = fabButton.contains(event.target) || fabOptions.contains(event.target);
        
        if (!isClickInside && fabOptions.classList.contains('active')) {
            fabButton.classList.remove('active');
            fabOptions.classList.remove('active');
        }
    });
    
    // Obter o caminho atual da página
    const currentPath = window.location.pathname;
    
    // Configurar ações dos botões do menu
    const fabEvidenceGenerator = document.getElementById('fab-evidence-generator');
    if (fabEvidenceGenerator) {
        fabEvidenceGenerator.addEventListener('click', function() {
            // Verificar se já estamos na página do gerador de evidências
            if (currentPath.includes('docjobs.html') || !currentPath.includes('index.html')) {
                window.location.href = 'index.html';
            } else {
                // Já estamos na página do gerador de evidências, então apenas fechamos o menu
                fabButton.classList.remove('active');
                fabOptions.classList.remove('active');
            }
        });
    }
    
    const fabDocjobsGenerator = document.getElementById('fab-docjobs-generator');
    if (fabDocjobsGenerator) {
        fabDocjobsGenerator.addEventListener('click', function() {
            // Verificar se já estamos na página do gerador de DOCJOBS
            if (!currentPath.includes('docjobs.html')) {
                window.location.href = 'docjobs.html';
            } else {
                // Já estamos na página do gerador de DOCJOBS, então apenas fechamos o menu
                fabButton.classList.remove('active');
                fabOptions.classList.remove('active');
            }
        });
    }
});