document.addEventListener('DOMContentLoaded', function() {
    const testerInfoForm = document.getElementById('testerInfoForm');
    const testForm = document.getElementById('testForm');
    const testExecutions = document.getElementById('testExecutions');
    const generatePdfBtn = document.getElementById('generatePdf');
    const testerInfoSection = document.getElementById('testerInfoSection');
    const testExecutionSection = document.getElementById('testExecutionSection');
    const deleteAllTestsBtn = document.getElementById('deleteAllTestsBtn');
    const pdfList = document.getElementById('pdfList');
    
    // Criar modal de edição
    createEditModal();

    // Verificar se já existe informação do testador
    checkTesterInfo();
    
    // Configurar os campos de status
    setupStatusFields();
    
    // Carregar execuções ao iniciar
    loadExecutions();
    
    // Carregar PDFs disponíveis
    loadAvailablePDFs();
    
    // Configurar listeners para exibição de arquivos selecionados
    setupFileDisplayListeners();
    
    // Configurar botões de ação em lote para PDFs
    setupBulkPdfActions();
    
    // Função para configurar listeners de exibição de arquivos
    function setupFileDisplayListeners() {
        const fileInput = document.getElementById('testEvidence');
        const editFileInput = document.getElementById('editTestEvidence');
        
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                displaySelectedFiles(this, 'selectedFiles');
            });
        }
        
        if (editFileInput) {
            editFileInput.addEventListener('change', function() {
                displaySelectedFiles(this, 'editSelectedFiles');
            });
        }
    }
    
    // Função para exibir arquivos selecionados com ícones apropriados
    function displaySelectedFiles(input, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (input.files.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        let html = `<p class="font-medium">${input.files.length} arquivo(s) selecionado(s):</p><div class="mt-2 space-y-1">`;
        
        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            const icon = getFileIcon(file.name);
            const size = formatFileSize(file.size);
            
            html += `
                <div class="flex items-center space-x-2 text-sm">
                    <i class="${icon} text-blue-500"></i>
                    <span class="truncate">${file.name}</span>
                    <span class="text-gray-400">(${size})</span>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Função para obter ícone baseado no tipo de arquivo
    function getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        // Imagens
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'svg'].includes(extension)) {
            return 'fas fa-image';
        }
        // Documentos PDF
        if (extension === 'pdf') {
            return 'fas fa-file-pdf';
        }
        // Documentos Word
        if (['doc', 'docx'].includes(extension)) {
            return 'fas fa-file-word';
        }
        // Planilhas Excel
        if (['xls', 'xlsx'].includes(extension)) {
            return 'fas fa-file-excel';
        }
        // Apresentações PowerPoint
        if (['ppt', 'pptx'].includes(extension)) {
            return 'fas fa-file-powerpoint';
        }
        // Vídeos
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(extension)) {
            return 'fas fa-file-video';
        }
        // Áudio
        if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'].includes(extension)) {
            return 'fas fa-file-audio';
        }
        // Arquivos compactados
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
            return 'fas fa-file-archive';
        }
        // Texto
        if (['txt', 'csv', 'json', 'xml', 'log'].includes(extension)) {
            return 'fas fa-file-alt';
        }
        // Padrão
        return 'fas fa-file';
    }
    
    // Função para formatar tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Função para verificar se já existe informação do testador
    async function checkTesterInfo() {
        try {
            const response = await fetch('/api/test-info');
            const data = await response.json();
            
            if (data && data.id) {
                // Preencher o formulário com os dados existentes
                document.getElementById('originId').value = data.origin_id || '';
                document.getElementById('originDescription').value = data.origin_description || '';
                document.getElementById('testType').value = data.test_type || 'Funcional';
                document.getElementById('systems').value = data.systems || '';
                document.getElementById('environment').value = data.environment || '';
                document.getElementById('testerName').value = data.tester_name || '';
                document.getElementById('role').value = data.role || 'QA';
                document.getElementById('company').value = data.company || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('summary').value = data.summary || '';
                
                // Mostrar o formulário de cadastro de testes
                testerInfoSection.style.display = 'block';
                testExecutionSection.style.display = 'block';
                console.log('Exibindo seção de execução de testes');
                
                // Garantir que a seção seja visível com um reflow
                void testExecutionSection.offsetWidth;
            } else {
                // Mostrar apenas o formulário de cadastro do testador
                testerInfoSection.style.display = 'block';
                testExecutionSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Error:', error);
            // Em caso de erro, garantir que a seção de testes não seja exibida
            testExecutionSection.style.display = 'none';
        }
    }
    
    // Manipular envio do formulário de informações do testador
    testerInfoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(testerInfoForm);
        const jsonData = {};
        
        // Converter FormData para JSON
        for (const [key, value] of formData.entries()) {
            jsonData[key] = value;
        }
        
        try {
            const response = await fetch('/api/test-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
            
            if (response.ok) {
                // Garantir que a seção de execução de testes seja exibida
                testExecutionSection.style.display = 'block';
                
                // Forçar um reflow para garantir que a mudança de estilo seja aplicada
                void testExecutionSection.offsetWidth;
                
                // Adicionar uma classe para destacar a seção
                testExecutionSection.classList.add('highlight-section');
                
                // Rolar a página para a seção de execução de testes
                testExecutionSection.scrollIntoView({ behavior: 'smooth' });
                
                // Notificar o usuário após a seção estar visível
                setTimeout(() => {
                    alert('Informações do testador salvas com sucesso!');
                }, 500);
            } else {
                const errorData = await response.json();
                alert('Erro ao salvar informações do testador: ' + (errorData.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao conectar com o servidor');
        }
    });

    // Manipular envio do formulário
    testForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(testForm);
        const jsonData = {};
        
        // Verificar se há arquivos para upload
        const fileInput = document.getElementById('testEvidence');
        const hasFiles = fileInput.files.length > 0;
        
        // Obter o nome do testador para usar como responsável
        const testerName = document.getElementById('testerName').value || 'Testador';
        
        // Converter FormData para JSON (exceto o arquivo) e mapear para os nomes esperados pelo backend
        for (const [key, value] of formData.entries()) {
            // Não incluir o arquivo no JSON
            if (key !== 'testEvidence') {
                // Mapear os nomes dos campos para os esperados pelo backend
                if (key === 'testId') {
                    jsonData['test_id'] = value;
                } else if (key === 'testDescription') {
                    jsonData['description'] = value;
                } else if (key === 'testPreconditions') {
                    jsonData['preconditions'] = value;
                } else if (key === 'status') {
                    jsonData['status'] = value;
                } else if (key === 'errorDescription') {
                    jsonData['error_description'] = value;
                } else if (key === 'errorCorrection') {
                    jsonData['error_correction'] = value;
                } else {
                    jsonData[key] = value;
                }
            }
        }
        
        // Adicionar o responsável ao JSON
        jsonData['responsible'] = testerName;
        
        try {
            // Primeiro, enviar os dados do formulário como JSON
            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Se houver arquivos, fazer upload de cada um separadamente
                if (hasFiles) {
                    let uploadErrors = 0;
                    
                    for (let i = 0; i < fileInput.files.length; i++) {
                        const fileFormData = new FormData();
                        fileFormData.append('file', fileInput.files[i]);
                        
                        try {
                            // Incluir o ID do teste na URL de upload
                            const testId = result.data.id;
                            const uploadResponse = await fetch(`/api/upload/${testId}`, {
                                method: 'POST',
                                body: fileFormData
                            });
                            
                            if (!uploadResponse.ok) {
                                uploadErrors++;
                            }
                        } catch (error) {
                            console.error('Error uploading file:', error);
                            uploadErrors++;
                        }
                    }
                    
                    if (uploadErrors > 0) {
                        alert(`Dados salvos, mas houve erro ao fazer upload de ${uploadErrors} arquivo(s)`);
                    }
                }
                
                testForm.reset();
                loadExecutions();
            } else {
                const errorData = await response.json();
                alert('Erro ao salvar execução: ' + (errorData.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao conectar com o servidor');
        }
    });

    // Gerar PDF
    generatePdfBtn.addEventListener('click', async function() {
        try {
            // Coletar os IDs dos testes selecionados
            const selectedTests = [];
            const checkboxes = document.querySelectorAll('.test-checkbox:checked');
            
            checkboxes.forEach(checkbox => {
                selectedTests.push(parseInt(checkbox.getAttribute('data-id')));
            });
            
            if (selectedTests.length === 0) {
                alert('Selecione pelo menos um teste para gerar o PDF');
                return;
            }
            
            // Enviar os IDs selecionados para o backend
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ test_ids: selectedTests })
            });
            
            if (response.ok) {
                // Obter a URL do PDF gerado
                const result = await response.json();
                
                // Abrir o PDF em uma nova aba
                window.open(result.pdf_url, '_blank');
                
                // Atualizar a lista de PDFs disponíveis
                loadAvailablePDFs();
            } else {
                alert('Erro ao gerar PDF');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
    
    // Adicionar botão para selecionar/desselecionar todos os testes
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'mt-2 mr-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';
    selectAllBtn.textContent = 'Selecionar Todos';
    selectAllBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.test-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
        });
        
        this.textContent = allChecked ? 'Selecionar Todos' : 'Desselecionar Todos';
    });
    
    // Inserir o botão antes do botão de gerar PDF
    generatePdfBtn.parentNode.insertBefore(selectAllBtn, generatePdfBtn);

    // Função para criar o modal de edição
    function createEditModal() {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'editModalContainer';
        modalContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center hidden z-50 overflow-y-auto py-6';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col my-auto';
        
        modalContent.innerHTML = `
            <div class="sticky top-0 bg-white px-6 pt-6 pb-3 border-b border-gray-100 rounded-t-lg z-10">
                <h2 class="text-xl font-bold">Editar Execução de Teste</h2>
            </div>
            <form id="editTestForm" class="flex flex-col flex-1">
                <div class="px-6 py-4 overflow-y-auto flex-1" style="max-height: 70vh;">
                    <input type="hidden" id="editTestId">
                    <div class="mb-4">
                        <label for="editTestIdField" class="block text-sm font-medium text-gray-700">ID do Teste</label>
                        <input type="text" id="editTestIdField" name="testId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    </div>
                    <div class="mb-4">
                        <label for="editTestDescription" class="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea id="editTestDescription" name="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="editTestPreconditions" class="block text-sm font-medium text-gray-700">Pré-condições</label>
                        <textarea id="editTestPreconditions" name="preconditions" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="editTestResponsible" class="block text-sm font-medium text-gray-700">Responsável</label>
                        <input type="text" id="editTestResponsible" name="responsible" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Status da Execução</label>
                        <div class="flex space-x-4">
                            <div class="flex items-center">
                                <input type="radio" id="editStatusSuccess" name="editStatus" value="success" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500">
                                <label for="editStatusSuccess" class="ml-2 block text-sm text-gray-700">Sucesso</label>
                            </div>
                            <div class="flex items-center">
                                <input type="radio" id="editStatusError" name="editStatus" value="error" class="h-4 w-4 text-red-600 focus:ring-red-500">
                                <label for="editStatusError" class="ml-2 block text-sm text-gray-700">Erro</label>
                            </div>
                        </div>
                    </div>
                    <div id="editErrorDescriptionContainer" class="mb-4 hidden">
                        <label for="editErrorDescription" class="block text-sm font-medium text-gray-700">Descrição do Erro</label>
                        <textarea id="editErrorDescription" name="errorDescription" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div id="editErrorCorrectionContainer" class="mb-4 hidden">
                        <label for="editErrorCorrection" class="block text-sm font-medium text-gray-700">Correção do Defeito</label>
                        <textarea id="editErrorCorrection" name="errorCorrection" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Evidências (Prints)</label>
                        <div id="editEvidenceList" class="mb-3 border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
                            <!-- Lista de evidências atuais será carregada aqui -->
                        </div>
                        <label for="editTestEvidence" class="block text-sm font-medium text-gray-700">Adicionar novas evidências</label>
                        <input type="file" id="editTestEvidence" name="testEvidence" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z" multiple class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                        <div id="editSelectedFiles" class="mt-2 text-sm text-gray-500"></div>
                    </div>
                </div>
                <div class="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 rounded-b-lg flex justify-end space-x-3">
                    <button type="button" id="cancelEditBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancelar</button>
                    <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Salvar</button>
                </div>
            </form>
        `;
        
        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);
        
        // Adicionar eventos para o modal
        document.getElementById('cancelEditBtn').addEventListener('click', function() {
            document.getElementById('editModalContainer').classList.add('hidden');
        });
        
        // Mostrar os arquivos selecionados no formulário de edição
        document.getElementById('editTestEvidence').addEventListener('change', function() {
            const selectedFilesDiv = document.getElementById('editSelectedFiles');
            selectedFilesDiv.innerHTML = '';
            
            if (this.files.length > 0) {
                selectedFilesDiv.innerHTML = `<p>${this.files.length} arquivo(s) selecionado(s) para adicionar</p>`;
                for (let i = 0; i < this.files.length; i++) {
                    const fileItem = document.createElement('div');
                    fileItem.textContent = this.files[i].name;
                    selectedFilesDiv.appendChild(fileItem);
                }
            }
        });
        
        document.getElementById('editTestForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const testId = document.getElementById('editTestId').value;
            const testIdField = document.getElementById('editTestIdField').value;
            const description = document.getElementById('editTestDescription').value;
            const preconditions = document.getElementById('editTestPreconditions').value;
            const responsible = document.getElementById('editTestResponsible').value;
            const status = document.getElementById('editStatusError').checked ? 'error' : 'success';
            const errorDescription = document.getElementById('editErrorDescription').value;
            const errorCorrection = document.getElementById('editErrorCorrection').value;
            
            // Coletar as evidências que permaneceram na ordem atual (após drag-and-drop)
            const remainingEvidences = [];
            document.querySelectorAll('#editEvidenceList .evidence-item').forEach(item => {
                const filename = item.dataset.filename;
                if (filename) {
                    remainingEvidences.push(filename);
                }
            });
            
            try {
                // Primeiro, atualizar os dados do teste, incluindo a lista atualizada de evidências
                const response = await fetch(`/api/tests/${testId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        test_id: testIdField,
                        description: description,
                        preconditions: preconditions,
                        responsible: responsible,
                        status: status,
                        error_description: errorDescription,
                        error_correction: errorCorrection,
                        evidence_filenames: remainingEvidences
                    })
                });
                
                if (response.ok) {
                    // Verificar se há novos arquivos para upload
                    const fileInput = document.getElementById('editTestEvidence');
                    const hasFiles = fileInput.files.length > 0;
                    
                    if (hasFiles) {
                        let uploadErrors = 0;
                        
                        for (let i = 0; i < fileInput.files.length; i++) {
                            const fileFormData = new FormData();
                            fileFormData.append('file', fileInput.files[i]);
                            fileFormData.append('test_id', testId); // Adicionar o ID do teste para associar ao teste correto
                            
                            try {
                                const uploadResponse = await fetch('/api/upload-to-test', {
                                    method: 'POST',
                                    body: fileFormData
                                });
                                
                                if (!uploadResponse.ok) {
                                    uploadErrors++;
                                }
                            } catch (error) {
                                console.error('Error uploading file:', error);
                                uploadErrors++;
                            }
                        }
                        
                        if (uploadErrors > 0) {
                            alert(`Dados salvos, mas houve erro ao fazer upload de ${uploadErrors} arquivo(s)`);
                        }
                    }
                    
                    document.getElementById('editModalContainer').classList.add('hidden');
                    loadExecutions();
                    alert('Teste atualizado com sucesso!');
                } else {
                    const errorData = await response.json();
                    alert('Erro ao atualizar teste: ' + (errorData.error || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Erro ao conectar com o servidor');
            }
        });
    }
    
    // Função para carregar execuções
    async function loadExecutions() {
        try {
            const response = await fetch('/api/tests');
            const data = await response.json();
            
            testExecutions.innerHTML = '';
            
            if (data.length === 0) {
                testExecutions.innerHTML = '<p class="text-gray-500">Nenhuma execução registrada ainda.</p>';
                return;
            }
            
            data.forEach(execution => {
                const executionElement = document.createElement('div');
                executionElement.className = 'border border-gray-200 rounded-md p-4 mb-2 cursor-move hover:bg-gray-50 transition-colors';
                executionElement.draggable = true;
                executionElement.dataset.testId = execution.id;
                
                // Formatar o ID do teste como "Teste XX"
                const testNumber = execution.test_id ? execution.test_id.padStart(2, '0') : execution.id.toString().padStart(2, '0');
                
                executionElement.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-grip-vertical text-gray-400 text-sm" title="Arraste para reordenar"></i>
                            <h3 class="font-medium">Teste ${testNumber}</h3>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="edit-test-btn text-xs text-blue-500 hover:text-blue-700" data-id="${execution.id}" data-test-id="${execution.test_id}" data-description="${execution.description}" data-preconditions="${execution.preconditions || ''}" data-responsible="${execution.responsible || ''}" data-status="${execution.status || 'success'}" data-error-description="${execution.error_description || ''}" data-error-correction="${execution.error_correction || ''}">Editar</button>
                            <button class="delete-test-btn text-xs text-red-500 hover:text-red-700" data-id="${execution.id}">Excluir</button>
                            <input type="checkbox" class="test-checkbox" data-id="${execution.id}" checked>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">${execution.description}</p>
                    <div class="mt-2">
                        <span class="text-xs font-medium">Status: </span>
                        <span class="text-xs ${execution.status === 'error' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}">
                            ${execution.status === 'error' ? 'Erro' : 'Sucesso'}
                        </span>
                    </div>
                    ${execution.status === 'error' && execution.error_description ? `
                    <p class="text-xs text-red-600 mt-1">Descrição do Erro: ${execution.error_description}</p>
                    ` : ''}
                    ${execution.status === 'error' && execution.error_correction ? `
                    <p class="text-xs text-blue-600 mt-1">Correção do Defeito: ${execution.error_correction}</p>
                    ` : ''}
                    <p class="text-xs text-gray-500 mt-2">Pré-condições: ${execution.preconditions || 'N/A'}</p>
                    <p class="text-xs text-gray-500">Responsável: ${execution.responsible || 'N/A'}</p>
                    <p class="text-xs text-gray-500">Data: ${execution.created_at || 'N/A'}</p>
                `;
                
                // Se houver evidências, mostrar links para visualizá-las
                if (execution.evidence_filenames && execution.evidence_filenames.length > 0) {
                    const evidenceContainer = document.createElement('div');
                    evidenceContainer.className = 'mt-2';
                    
                    const evidenceTitle = document.createElement('p');
                    evidenceTitle.className = 'text-xs font-medium text-gray-700';
                    evidenceTitle.textContent = 'Evidências:';
                    evidenceContainer.appendChild(evidenceTitle);
                    
                    const evidenceList = document.createElement('div');
                    evidenceList.className = 'flex flex-wrap gap-2 mt-1';
                    
                    execution.evidence_filenames.forEach((filename, index) => {
                        const evidenceLink = document.createElement('a');
                        evidenceLink.href = `uploads/${filename}`;
                        evidenceLink.target = '_blank';
                        evidenceLink.className = 'text-xs text-blue-500 hover:underline';
                        evidenceLink.textContent = `Evidência ${index + 1}`;
                        evidenceList.appendChild(evidenceLink);
                    });
                    
                    evidenceContainer.appendChild(evidenceList);
                    executionElement.appendChild(evidenceContainer);
                }
                
                testExecutions.appendChild(executionElement);
            });
            
            // Configurar drag-and-drop
            setupDragAndDrop();
            
            // Adicionar eventos para os botões de edição e exclusão
            addTestButtonsEvents();
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Função para configurar drag-and-drop
    function setupDragAndDrop() {
        const executionElements = document.querySelectorAll('#testExecutions > div[data-test-id]');
        
        executionElements.forEach(element => {
            element.addEventListener('dragstart', handleDragStart);
            element.addEventListener('dragend', handleDragEnd);
            element.addEventListener('dragover', handleDragOver);
            element.addEventListener('drop', handleDrop);
            element.addEventListener('dragenter', handleDragEnter);
            element.addEventListener('dragleave', handleDragLeave);
        });
    }
    
    let draggedElement = null;
    
    function handleDragStart(e) {
        draggedElement = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleDragEnd(e) {
        this.style.opacity = '1';
        document.querySelectorAll('#testExecutions > div[data-test-id]').forEach(element => {
            element.classList.remove('bg-blue-50');
            element.classList.remove('border-blue-400');
        });
        draggedElement = null;
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDragEnter(e) {
        if (this !== draggedElement && draggedElement) {
            this.classList.add('bg-blue-50');
            this.classList.add('border-blue-400');
        }
    }
    
    function handleDragLeave(e) {
        this.classList.remove('bg-blue-50');
        this.classList.remove('border-blue-400');
    }
    
    async function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (draggedElement !== this && draggedElement) {
            this.classList.remove('bg-blue-50');
            this.classList.remove('border-blue-400');
            
            // Trocar de posição no DOM
            const parent = this.parentNode;
            if (draggedElement.parentNode === parent) {
                if (this.nextSibling) {
                    parent.insertBefore(draggedElement, this);
                } else {
                    parent.appendChild(draggedElement);
                }
                
                // Salvar a nova ordem no servidor
                saveExecutionOrder();
            }
        }
        
        return false;
    }
    
    // Funções de drag-and-drop para evidências
    let draggedEvidence = null;
    
    function handleEvidenceDragStart(e) {
        draggedEvidence = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleEvidenceDragEnd(e) {
        this.style.opacity = '1';
        document.querySelectorAll('.evidence-item').forEach(element => {
            element.classList.remove('bg-blue-50');
            element.classList.remove('border-blue-300');
        });
        draggedEvidence = null;
    }
    
    function handleEvidenceDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleEvidenceDragEnter(e) {
        if (this !== draggedEvidence && draggedEvidence) {
            this.classList.add('bg-blue-50');
            this.classList.add('border-blue-300');
        }
    }
    
    function handleEvidenceDragLeave(e) {
        this.classList.remove('bg-blue-50');
        this.classList.remove('border-blue-300');
    }
    
    function handleEvidenceDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (draggedEvidence !== this && draggedEvidence) {
            this.classList.remove('bg-blue-50');
            this.classList.remove('border-blue-300');
            
            // Trocar de posição no DOM
            const parent = this.parentNode;
            if (draggedEvidence.parentNode === parent) {
                if (this.nextSibling) {
                    parent.insertBefore(draggedEvidence, this);
                } else {
                    parent.appendChild(draggedEvidence);
                }
                
                // Atualizar numeração das evidências
                updateEvidenceNumbers();
            }
        }
        
        return false;
    }
    
    // Função para configurar drag-and-drop nas evidências
    function setupEvidenceDragAndDrop() {
        const evidenceItems = document.querySelectorAll('.evidence-item');
        
        evidenceItems.forEach(element => {
            element.addEventListener('dragstart', handleEvidenceDragStart);
            element.addEventListener('dragend', handleEvidenceDragEnd);
            element.addEventListener('dragover', handleEvidenceDragOver);
            element.addEventListener('drop', handleEvidenceDrop);
            element.addEventListener('dragenter', handleEvidenceDragEnter);
            element.addEventListener('dragleave', handleEvidenceDragLeave);
        });
    }
    
    // Função para atualizar a numeração das evidências após reordenação
    function updateEvidenceNumbers() {
        const evidenceItems = document.querySelectorAll('.evidence-item');
        evidenceItems.forEach((item, index) => {
            const numberSpan = item.querySelector('.text-gray-600');
            if (numberSpan) {
                numberSpan.textContent = `Evidência ${index + 1}:`;
            }
        });
    }
    
    // Função para salvar a ordem das execuções no servidor
    async function saveExecutionOrder() {
        try {
            const testIds = [];
            document.querySelectorAll('#testExecutions > div[data-test-id]').forEach(element => {
                testIds.push(parseInt(element.dataset.testId));
            });
            
            const response = await fetch('/api/tests/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ test_ids: testIds })
            });
            
            if (!response.ok) {
                const error = await response.json();
                console.error('Erro ao salvar ordem:', error);
                // Recarregar as execuções em caso de erro
                loadExecutions();
            }
        } catch (error) {
            console.error('Erro ao salvar ordem das execuções:', error);
        }
    }
    
    // Função para configurar os campos de status
    function setupStatusFields() {
        // Para o formulário principal
        const statusSuccess = document.getElementById('statusSuccess');
        const statusError = document.getElementById('statusError');
        const errorDescriptionContainer = document.getElementById('errorDescriptionContainer');
        const errorCorrectionContainer = document.getElementById('errorCorrectionContainer');
        
        if (statusSuccess && statusError) {
            statusSuccess.addEventListener('change', function() {
                if (this.checked) {
                    errorDescriptionContainer.classList.add('hidden');
                    errorCorrectionContainer.classList.add('hidden');
                }
            });
            
            statusError.addEventListener('change', function() {
                if (this.checked) {
                    errorDescriptionContainer.classList.remove('hidden');
                    errorCorrectionContainer.classList.remove('hidden');
                }
            });
        }
        
        // Para o formulário de edição
        const editStatusSuccess = document.getElementById('editStatusSuccess');
        const editStatusError = document.getElementById('editStatusError');
        const editErrorDescriptionContainer = document.getElementById('editErrorDescriptionContainer');
        const editErrorCorrectionContainer = document.getElementById('editErrorCorrectionContainer');
        
        if (editStatusSuccess && editStatusError) {
            editStatusSuccess.addEventListener('change', function() {
                if (this.checked) {
                    editErrorDescriptionContainer.classList.add('hidden');
                    editErrorCorrectionContainer.classList.add('hidden');
                }
            });
            
            editStatusError.addEventListener('change', function() {
                if (this.checked) {
                    editErrorDescriptionContainer.classList.remove('hidden');
                    editErrorCorrectionContainer.classList.remove('hidden');
                }
            });
        }
    }
    
    // Função para adicionar eventos aos botões de edição e exclusão
    function addTestButtonsEvents() {
        // Adicionar evento para os botões de edição
        document.querySelectorAll('.edit-test-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const testId = this.getAttribute('data-id');
                const testIdField = this.getAttribute('data-test-id');
                const description = this.getAttribute('data-description');
                const preconditions = this.getAttribute('data-preconditions');
                const responsible = this.getAttribute('data-responsible');
                const status = this.getAttribute('data-status') || 'success';
                const errorDescription = this.getAttribute('data-error-description') || '';
                const errorCorrection = this.getAttribute('data-error-correction') || '';
                
                // Preencher o formulário de edição
                document.getElementById('editTestId').value = testId;
                document.getElementById('editTestIdField').value = testIdField;
                document.getElementById('editTestDescription').value = description;
                document.getElementById('editTestPreconditions').value = preconditions;
                document.getElementById('editTestResponsible').value = responsible;
                
                // Definir o status
                if (status === 'error') {
                    document.getElementById('editStatusError').checked = true;
                    document.getElementById('editErrorDescriptionContainer').classList.remove('hidden');
                    document.getElementById('editErrorCorrectionContainer').classList.remove('hidden');
                } else {
                    document.getElementById('editStatusSuccess').checked = true;
                    document.getElementById('editErrorDescriptionContainer').classList.add('hidden');
                    document.getElementById('editErrorCorrectionContainer').classList.add('hidden');
                }
                
                // Preencher descrição do erro e correção
                document.getElementById('editErrorDescription').value = errorDescription;
                document.getElementById('editErrorCorrection').value = errorCorrection;
                
                // Limpar a lista de evidências e o campo de upload
                document.getElementById('editEvidenceList').innerHTML = '';
                document.getElementById('editTestEvidence').value = '';
                document.getElementById('editSelectedFiles').innerHTML = '';
                
                // Buscar os detalhes completos do teste para obter as evidências
                try {
                    const response = await fetch(`/api/tests/${testId}`);
                    if (response.ok) {
                        const testData = await response.json();
                        
                        // Exibir as evidências existentes
                        const evidenceList = document.getElementById('editEvidenceList');
                        
                        if (testData.evidence_filenames && testData.evidence_filenames.length > 0) {
                            testData.evidence_filenames.forEach((filename, index) => {
                                const evidenceItem = document.createElement('div');
                                evidenceItem.className = 'flex items-center justify-between p-2 border-b border-gray-100 cursor-move hover:bg-gray-50 transition-colors evidence-item';
                                evidenceItem.draggable = true;
                                evidenceItem.dataset.filename = filename;
                                evidenceItem.innerHTML = `
                                    <div class="flex items-center">
                                        <i class="fas fa-grip-vertical text-gray-400 text-xs mr-2" title="Arraste para reordenar"></i>
                                        <span class="text-xs text-gray-600 mr-2">Evidência ${index + 1}:</span>
                                        <a href="uploads/${filename}" target="_blank" class="text-xs text-blue-500 hover:underline">${filename}</a>
                                    </div>
                                    <button type="button" class="remove-evidence-btn text-xs text-red-500 hover:text-red-700" data-filename="${filename}">Remover</button>
                                `;
                                evidenceList.appendChild(evidenceItem);
                            });
                            
                            // Configurar drag-and-drop para evidências
                            setupEvidenceDragAndDrop();
                            
                            // Adicionar evento para os botões de remoção de evidência
                            document.querySelectorAll('.remove-evidence-btn').forEach(btn => {
                                btn.addEventListener('click', function() {
                                    const filename = this.getAttribute('data-filename');
                                    this.closest('.evidence-item').remove();
                                    updateEvidenceNumbers();
                                });
                            });
                        } else {
                            evidenceList.innerHTML = '<p class="text-xs text-gray-500 p-1">Nenhuma evidência cadastrada.</p>';
                        }
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
                
                // Mostrar o modal
                document.getElementById('editModalContainer').classList.remove('hidden');
            });
        });
        
        // Adicionar evento para os botões de exclusão
        document.querySelectorAll('.delete-test-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const testId = this.getAttribute('data-id');
                
                if (confirm('Tem certeza que deseja excluir este teste? Esta ação não pode ser desfeita.')) {
                    try {
                        const response = await fetch(`/api/tests/${testId}`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            loadExecutions();
                            alert('Teste excluído com sucesso!');
                        } else {
                            const errorData = await response.json();
                            alert('Erro ao excluir teste: ' + (errorData.error || 'Erro desconhecido'));
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Erro ao conectar com o servidor');
                    }
                }
            });
        });
    }
    
    // Adicionar evento para o botão de exclusão de todas as execuções
    deleteAllTestsBtn.addEventListener('click', async function() {
        if (confirm('Tem certeza que deseja excluir TODAS as execuções de teste? Esta ação não pode ser desfeita.')) {
            try {
                const response = await fetch('/api/tests/delete-all', {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadExecutions();
                    alert('Todas as execuções foram excluídas com sucesso!');
                } else {
                    const errorData = await response.json();
                    alert('Erro ao excluir todas as execuções: ' + (errorData.error || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Erro ao conectar com o servidor');
            }
        }
    });
    
    // Função para carregar os PDFs disponíveis
    async function loadAvailablePDFs() {
        try {
            const response = await fetch('/api/pdfs');
            const data = await response.json();
            
            pdfList.innerHTML = '';
            
            if (data.length === 0) {
                pdfList.innerHTML = '<p class="text-gray-500">Nenhum PDF gerado ainda.</p>';
                return;
            }
            
            // Criar uma tabela para exibir os PDFs
            const table = document.createElement('table');
            table.className = 'min-w-full divide-y divide-gray-200';
            
            // Cabeçalho da tabela
            const thead = document.createElement('thead');
            thead.className = 'bg-gray-50';
            thead.innerHTML = `
                <tr>
                    <th scope="col" class="px-4 py-3 text-left">
                        <input type="checkbox" id="selectAllPdfsCheckbox" class="rounded text-indigo-600 focus:ring-indigo-500">
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Geração</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Corpo da tabela
            const tbody = document.createElement('tbody');
            tbody.className = 'bg-white divide-y divide-gray-200';
            
            data.forEach((pdf, index) => {
                const row = document.createElement('tr');
                row.className = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
                
                row.innerHTML = `
                    <td class="px-4 py-4 whitespace-nowrap">
                        <input type="checkbox" class="pdf-checkbox rounded text-indigo-600 focus:ring-indigo-500" data-filename="${pdf.filename}" data-url="${pdf.url}">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${pdf.created_at}</td>
                    <td class="px-6 py-4 text-sm text-gray-500 break-all max-w-xs md:max-w-md lg:max-w-xl">${pdf.filename}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="${pdf.url}" target="_blank" class="text-indigo-600 hover:text-indigo-900">Visualizar</a>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            pdfList.appendChild(table);

            // Adicionar evento para o checkbox "Selecionar Todos" na tabela
            const selectAllCheckbox = document.getElementById('selectAllPdfsCheckbox');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('.pdf-checkbox');
                    checkboxes.forEach(cb => cb.checked = this.checked);
                });
            }
            
        } catch (error) {
            console.error('Error:', error);
            pdfList.innerHTML = '<p class="text-red-500">Erro ao carregar PDFs. Por favor, tente novamente.</p>';
        }
    }

    // Função para adicionar eventos aos botões de exclusão de PDF
    function addPdfDeleteButtonsEvents() {
        document.querySelectorAll('.delete-pdf-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const filename = this.getAttribute('data-filename');
                
                if (confirm(`Tem certeza que deseja excluir o arquivo ${filename}? Esta ação não pode ser desfeita.`)) {
                    try {
                        const response = await fetch(`/api/pdfs/${filename}`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            loadAvailablePDFs(); // Recarregar a lista de PDFs
                            alert('Arquivo PDF excluído com sucesso!');
                        } else {
                            const errorData = await response.json();
                            alert('Erro ao excluir PDF: ' + (errorData.error || 'Erro desconhecido'));
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Erro ao conectar com o servidor');
                    }
                }
            });
        });
    }
    
    // Função para configurar ações em lote para PDFs
    function setupBulkPdfActions() {
        const selectAllBtn = document.getElementById('selectAllPdfs');
        const downloadBtn = document.getElementById('downloadSelectedPdfs');
        const deleteBtn = document.getElementById('deleteSelectedPdfs');
        
        // Botão Selecionar Todos
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', function() {
                const checkboxes = document.querySelectorAll('.pdf-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                
                checkboxes.forEach(cb => cb.checked = !allChecked);
                
                // Atualizar também o checkbox da tabela
                const tableCheckbox = document.getElementById('selectAllPdfsCheckbox');
                if (tableCheckbox) {
                    tableCheckbox.checked = !allChecked;
                }
                
                // Atualizar texto do botão
                const icon = this.querySelector('i');
                if (!allChecked) {
                    icon.className = 'fas fa-square mr-2';
                    this.innerHTML = '<i class="fas fa-square mr-2"></i>Desselecionar Todos';
                } else {
                    icon.className = 'fas fa-check-square mr-2';
                    this.innerHTML = '<i class="fas fa-check-square mr-2"></i>Selecionar Todos';
                }
            });
        }
        
        // Botão Baixar Selecionados
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                const selectedCheckboxes = document.querySelectorAll('.pdf-checkbox:checked');
                
                if (selectedCheckboxes.length === 0) {
                    alert('Selecione pelo menos um PDF para baixar.');
                    return;
                }
                
                // Baixar cada PDF selecionado
                selectedCheckboxes.forEach(checkbox => {
                    const url = checkbox.getAttribute('data-url');
                    const filename = checkbox.getAttribute('data-filename');
                    
                    // Criar um link temporário para download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
                
                alert(`${selectedCheckboxes.length} arquivo(s) estão sendo baixados.`);
            });
        }
        
        // Botão Excluir Selecionados
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function() {
                const selectedCheckboxes = document.querySelectorAll('.pdf-checkbox:checked');
                
                if (selectedCheckboxes.length === 0) {
                    alert('Selecione pelo menos um PDF para excluir.');
                    return;
                }
                
                const count = selectedCheckboxes.length;
                if (!confirm(`Tem certeza que deseja excluir ${count} arquivo(s)? Esta ação não pode ser desfeita.`)) {
                    return;
                }
                
                let successCount = 0;
                let errorCount = 0;
                
                // Excluir cada PDF selecionado
                for (const checkbox of selectedCheckboxes) {
                    const filename = checkbox.getAttribute('data-filename');
                    
                    try {
                        const response = await fetch(`/api/pdfs/${filename}`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        errorCount++;
                    }
                }
                
                // Recarregar a lista de PDFs
                loadAvailablePDFs();
                
                // Mostrar resultado
                if (errorCount === 0) {
                    alert(`${successCount} arquivo(s) excluído(s) com sucesso!`);
                } else {
                    alert(`${successCount} arquivo(s) excluído(s) com sucesso. ${errorCount} erro(s) encontrado(s).`);
                }
            });
        }
    }
});