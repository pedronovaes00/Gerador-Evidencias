document.addEventListener('DOMContentLoaded', function() {
    const docjobsForm = document.getElementById('docjobsForm');
    const clearFormBtn = document.getElementById('clearForm');
    
    // Verificar se estamos na página do gerador de DOCJOBS
    if (!docjobsForm) return;
    
    // Configurar evento para o botão de limpar formulário
    clearFormBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
            docjobsForm.reset();
        }
    });
    
    // Configurar evento para o formulário
    docjobsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generateDocJobsDocument();
    });
    
    // Adicionar eventos para limpar estilos de erro quando o usuário digitar
    const requiredFieldIds = [
        'smNumber', 'callNumber', 'requester', 'phone', 'requestDate', 'deadlineDate',
        'subject', 'system', 'businessImpact', 'criticality', 'jobName', 'shellName',
        'path', 'server', 'ip', 'jobDescription', 'frequencyDetails', 'returnCode'
    ];
    
    requiredFieldIds.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', function() {
                // Limpar estilos de erro quando o usuário começar a digitar
                if (this.value.trim() !== '') {
                    this.style.borderColor = '';
                    this.style.backgroundColor = '';
                    this.style.borderWidth = '';
                }
            });
            
            element.addEventListener('focus', function() {
                // Limpar estilos de erro quando o campo receber foco
                this.style.borderColor = '';
                this.style.backgroundColor = '';
                this.style.borderWidth = '';
            });
        }
    });
    
    // Função para validar campos obrigatórios no frontend
    function validateRequiredFields(data) {
        const requiredFields = {
            'smNumber': 'Número da SM',
            'callNumber': 'Número do Chamado', 
            'requester': 'Solicitante',
            'phone': 'Telefone',
            'requestDate': 'Data Solicitação',
            'deadlineDate': 'Data limite p/ produção',
            'subject': 'Assunto',
            'system': 'Sistema',
            'businessImpact': 'Impacto do Negócio',
            'criticality': 'Criticidade',
            'jobName': 'Nome do Job',
            'shellName': 'Nome do Shell',
            'path': 'Path',
            'server': 'Servidor',
            'ip': 'IP',
            'jobDescription': 'Descrição do Job',
            'frequencyDetails': 'Detalhamento da Frequência',
            'returnCode': 'Return Code'
        };
        
        const missingFields = [];
        const fieldElements = {};
        
        // Limpar estilos anteriores
        Object.keys(requiredFields).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.style.borderColor = '';
                element.style.backgroundColor = '';
                fieldElements[fieldId] = element;
            }
        });
        
        // Verificar campos obrigatórios
        Object.keys(requiredFields).forEach(fieldId => {
            const value = data[fieldId];
            if (!value || value.toString().trim() === '') {
                missingFields.push({
                    field: fieldId,
                    label: requiredFields[fieldId]
                });
                
                // Destacar campo em vermelho
                const element = fieldElements[fieldId];
                if (element) {
                    element.style.borderColor = '#ef4444';
                    element.style.backgroundColor = '#fef2f2';
                    element.style.borderWidth = '2px';
                }
            }
        });
        
        return missingFields;
    }

    // Função para gerar o documento DOCJOBS
    function generateDocJobsDocument() {
        // Obter todos os valores do formulário
        const formData = new FormData(docjobsForm);
        const docData = {};
        
        // Converter FormData para objeto
        for (const [key, value] of formData.entries()) {
            docData[key] = value;
        }
        
        // Processar campos de horário separados
        const startHour = docData.startHour || '01';
        const startMinute = docData.startMinute || '00';
        const endHour = docData.endHour;
        const endMinute = docData.endMinute;
        
        docData.startTime = `${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')}`;
        docData.endTime = endHour && endMinute ? `${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}` : '';
        
        // Validar campos obrigatórios antes de enviar
        const missingFields = validateRequiredFields(docData);
        if (missingFields.length > 0) {
            const fieldLabels = missingFields.map(f => f.label).join('\n• ');
            showErrorMessage(`Os seguintes campos obrigatórios não foram preenchidos:\n\n• ${fieldLabels}\n\nPor favor, preencha todos os campos destacados em vermelho.`);
            
            // Focar no primeiro campo com erro
            const firstMissingField = document.getElementById(missingFields[0].field);
            if (firstMissingField) {
                firstMissingField.focus();
                firstMissingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Mapear os campos do formulário para os campos esperados pela API
        const apiData = {
            smNumber: docData.smNumber || '',
            callNumber: docData.callNumber || '',
            requester: docData.requester || '',
            phone: docData.phone || '',
            requestType: docData.requestType || 'Criação de Job',
            environment: docData.environment || 'Produção',
            requestDate: docData.requestDate || '',
            deadlineDate: docData.deadlineDate || '',
            subject: docData.subject || '',
            businessUnit: docData.businessUnit || 'DRDR - Tarifação',
            system: docData.system || '',
            businessImpact: docData.businessImpact || '',
            criticality: docData.criticality || '',
            
            // Informações gerais
            jobName: docData.jobName || '',
            owner: docData.owner || '',
            shellName: docData.shellName || '',
            path: docData.path || '',
            server: docData.server || '',
            ip: docData.ip || '',
            jobDescription: docData.jobDescription || '',
            
            // Frequência
            frequencyType: docData.frequencyType || 'Diário',
            frequency: docData.frequencyType || 'Diário',
            startTime: docData.startTime || '01:00',
            endTime: docData.endTime || '',
            monday: docData.monday === 'on' ? 'on' : '',
            tuesday: docData.tuesday === 'on' ? 'on' : '',
            wednesday: docData.wednesday === 'on' ? 'on' : '',
            thursday: docData.thursday === 'on' ? 'on' : '',
            friday: docData.friday === 'on' ? 'on' : '',
            saturday: docData.saturday === 'on' ? 'on' : '',
            sunday: docData.sunday === 'on' ? 'on' : '',
            frequencyDetails: docData.frequencyDetails || 'Detalhamento automático baseado na seleção',
            
            // Condições
            predecessorProcess: docData.predecessorProcess || 'N/A',
            successorProcess: docData.successorProcess || 'N/A',
            
            // Recursos
            parallelExecution: docData.parallelExecution || 'Não',
            processNames: docData.processNames || 'N/A',
            
            // Parâmetros
            param1: docData.param1 || '',
            param2: docData.param2 || '',
            param3: docData.param3 || '',
            param4: docData.param4 || '',
            param5: docData.param5 || '',
            param6: docData.param6 || '',
            param7: docData.param7 || '',
            param8: docData.param8 || '',
            
            // Return Code
            returnCode: docData.returnCode || '',
            
            // Email
            emailNotification: docData.emailNotification || '',
            
            // Observações
            observations: docData.observations || '',
            
            // Assinaturas
            executor: docData.executor || '',
            executionDate: docData.executionDate || '',
            approver: docData.approver || '',
            approvalDate: docData.approvalDate || ''
        };
        
        // Mostrar indicador de carregamento ou mensagem
        const submitBtn = docjobsForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando documento...';
        submitBtn.disabled = true;
        
        // Enviar os dados para a API
        fetch('/api/generate-docjobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erro ao gerar documento');
                });
            }
            return response.json();
        })
        .then(data => {
            // Criar um link para download do arquivo gerado
            const link = document.createElement('a');
            link.href = `/docjobs/${encodeURIComponent(data.filename)}`;
            link.download = data.filename;
            console.log('Download URL:', link.href);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Mostrar mensagem de sucesso com mais detalhes
            showSuccessMessage(`Documento DOCJOBS BRM gerado com sucesso!\n\nArquivo: ${data.filename}\n\nO download foi iniciado automaticamente.`);
        })
        .catch(error => {
            console.error('Erro:', error);
            
            // Tentar extrair informações detalhadas do erro
            let errorMessage = error.message;
            let missingFields = [];
            
            // Se o erro contém informações sobre campos ausentes do backend
            if (error.message.includes('Campos obrigatórios não preenchidos')) {
                // Tentar fazer uma nova requisição para obter detalhes dos campos ausentes
                fetch('/api/generate-docjobs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(apiData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.missing_fields) {
                        // Destacar campos ausentes retornados pelo backend
                        data.missing_fields.forEach(fieldInfo => {
                            const element = document.getElementById(fieldInfo.field);
                            if (element) {
                                element.style.borderColor = '#ef4444';
                                element.style.backgroundColor = '#fef2f2';
                                element.style.borderWidth = '2px';
                            }
                        });
                        
                        const fieldLabels = data.missing_fields.map(f => f.label).join('\n• ');
                        showErrorMessage(`Os seguintes campos obrigatórios não foram preenchidos:\n\n• ${fieldLabels}\n\nPor favor, preencha todos os campos destacados em vermelho.`);
                        
                        // Focar no primeiro campo com erro
                        if (data.missing_fields.length > 0) {
                            const firstMissingField = document.getElementById(data.missing_fields[0].field);
                            if (firstMissingField) {
                                firstMissingField.focus();
                                firstMissingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                    } else {
                        showErrorMessage(`Erro ao gerar documento DOCJOBS BRM:\n\n${errorMessage}\n\nVerifique se todos os campos obrigatórios foram preenchidos e tente novamente.`);
                    }
                })
                .catch(() => {
                    showErrorMessage(`Erro ao gerar documento DOCJOBS BRM:\n\n${errorMessage}\n\nVerifique se todos os campos obrigatórios foram preenchidos e tente novamente.`);
                });
            } else {
                showErrorMessage(`Erro ao gerar documento DOCJOBS BRM:\n\n${errorMessage}\n\nVerifique se todos os campos obrigatórios foram preenchidos e tente novamente.`);
            }
        })
        .finally(() => {
            // Restaurar o botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
    
    // Função para gerar o conteúdo HTML do documento
    function generateDocContent(data){
        // Obter a data atual formatada
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        // Verificar quais dias da semana estão marcados
        const weekdays = [];
        if (data.monday === 'on') weekdays.push('Segunda');
        if (data.tuesday === 'on') weekdays.push('Terça');
        if (data.wednesday === 'on') weekdays.push('Quarta');
        if (data.thursday === 'on') weekdays.push('Quinta');
        if (data.friday === 'on') weekdays.push('Sexta');
        if (data.saturday === 'on') weekdays.push('Sábado');
        if (data.sunday === 'on') weekdays.push('Domingo');
        
        // Criar o HTML para o documento Word
        return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>PLANILHA DE CADASTRO DE JOBS NO CONTROL-M</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 4px 8px;
                    vertical-align: top;
                }
                .header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .header-title {
                    color: #0000FF;
                    font-weight: bold;
                    font-size: 16px;
                    text-align: center;
                    width: 100%;
                }
                .blue-text {
                    color: #0000FF;
                    font-weight: bold;
                }
                .checkbox {
                    margin-right: 5px;
                }
                .checkbox-label {
                    margin-right: 15px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div style="display: flex; align-items: center;">
                    <div style="width: 60px; margin-right: 10px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
                            <path d="M50,5 C25.2,5 5,25.2 5,50 C5,74.8 25.2,95 50,95 C74.8,95 95,74.8 95,50 C95,25.2 74.8,5 50,5 Z" fill="#E40613"/>
                            <path d="M67,30 C67,30 67,38 59,38 C51,38 51,30 51,30 L51,70 L67,70 L67,30 Z" fill="white"/>
                            <path d="M33,30 L33,70 L49,70 L49,30 C49,30 49,38 41,38 C33,38 33,30 33,30 Z" fill="white"/>
                        </svg>
                    </div>
                    <div class="header-title" style="color: #0000FF; font-weight: bold;">PLANILHA DE CADASTRO DE JOBS NO CONTROL-M</div>
                </div>
            </div>
            
            <table>
                <tr>
                    <td width="50%">Número da SM: ${data.smNumber || ''}</td>
                    <td width="50%">Numero do Chamado: ${data.callNumber || ''}</td>
                </tr>
                <tr>
                    <td>Solicitante: ${data.requester || 'Eliel Alexandre Andrade Souza'}</td>
                    <td>Telefone: ${data.phone || '(85) 99629-6737'}</td>
                </tr>
                <tr>
                    <td>Tipo Solicitação: <span class="blue-text">Criação de Job</span></td>
                    <td>Ambiente: <span class="blue-text">Produção</span></td>
                </tr>
                <tr>
                    <td>Data Solicitação: ${data.requestDate || '10/10/2024'}</td>
                    <td>Data limite p/ produção: ${data.deadlineDate || '31/10/2024'}</td>
                </tr>
                <tr>
                    <td colspan="2">Assunto: ${data.subject || 'Automação de relatório Analítico Interfaces Contábeis'}</td>
                </tr>
                <tr>
                    <td>Unidade de Negócio: <span class="blue-text">DRDR - Tarifação</span></td>
                    <td>Sistema: ${data.system || 'BRM'}</td>
                </tr>
                <tr>
                    <td>Impacto do Negócio: ${data.businessImpact || ''}</td>
                    <td>Criticidade: ${data.criticality || 'Alta'}</td>
                </tr>
                <tr>
                    <td rowspan="5" width="15%">Geral</td>
                    <td>Nome do Job: ${data.jobName || 'relatorio_analitico_interf_contab'}</td>
                    <td>Owner:</td>
                </tr>
                <tr>
                    <td colspan="2">Nome do Shell: ${data.shellName || 'exec_brmappe.sh'}</td>
                </tr>
                <tr>
                    <td colspan="2">Path: ${data.path || '/brm/controlm/brmappe/scripts/'}</td>
                </tr>
                <tr>
                    <td colspan="2">Servidor: ${data.server || 'BRTOCLT500C'} &nbsp;&nbsp;&nbsp;&nbsp; IP: ${data.ip || '10.239.201.216'}</td>
                </tr>
                <tr>
                    <td colspan="2">Descrição do Job: ${data.jobDescription || 'Automatização de relatório Analítico Interfaces Contábeis'}</td>
                </tr>
                <tr>
                    <td>Frequência de Execução</td>
                    <td>
                        <span class="blue-text">${data.frequencyType || 'Diário'}</span> &nbsp;&nbsp;&nbsp;&nbsp; 
                        Horário Início (hh:mm): ${data.startTime || '01:00'} &nbsp;&nbsp;&nbsp;&nbsp; 
                        Horário Final (hh:mm): ${data.endTime || ''}
                    </td>
                </tr>
                <tr>
                    <td>
                        <input type="checkbox" class="checkbox" ${data.monday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Segunda</span>
                        
                        <input type="checkbox" class="checkbox" ${data.tuesday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Terça</span>
                        
                        <input type="checkbox" class="checkbox" ${data.wednesday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Quarta</span>
                        
                        <input type="checkbox" class="checkbox" ${data.thursday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Quinta</span>
                        
                        <input type="checkbox" class="checkbox" ${data.friday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Sexta</span>
                        
                        <input type="checkbox" class="checkbox" ${data.saturday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Sábado</span>
                        
                        <input type="checkbox" class="checkbox" ${data.sunday === 'on' ? 'checked' : ''} disabled>
                        <span class="checkbox-label">Domingo</span>
                    </td>
                </tr>
                <tr>
                    <td>Detalhamento da Frequência: ${data.frequencyDetails || ''}</td>
                </tr>
                <tr>
                    <td rowspan="2">Condições</td>
                    <td>Sub processo(s) Antecessor(es): ${data.predecessorProcess || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Sub processo(s) Sucessor(es): ${data.successorProcess || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Recursos</td>
                    <td>
                        Execução Paralela? <span class="blue-text">Não</span> &nbsp;&nbsp;&nbsp;&nbsp;
                        Nome dos Processos: ${data.processNames || 'N/A'}
                    </td>
                </tr>
                <tr>
                    <td rowspan="4">Parâmetros</td>
                    <td>
                        Parm1: ${data.param1 || '/brm/applic_relatorios/c_relatorios.sh'} &nbsp;&nbsp;&nbsp;&nbsp;
                        Parm5: ${data.param5 || ''}
                    </td>
                </tr>
                <tr>
                    <td>
                        Parm2: ${data.param2 || 'ANALITICO_INTERF_CONTAB'} &nbsp;&nbsp;&nbsp;&nbsp;
                        Parm6: ${data.param6 || ''}
                    </td>
                </tr>
                <tr>
                    <td>
                        Parm3: ${data.param3 || '<DATA>'} &nbsp;&nbsp;&nbsp;&nbsp;
                        Parm7: ${data.param7 || ''}
                    </td>
                </tr>
                <tr>
                    <td>
                        Parm4: ${data.param4 || ''} &nbsp;&nbsp;&nbsp;&nbsp;
                        Parm8: ${data.param8 || ''}
                    </td>
                </tr>
                <tr>
                    <td colspan="2">Return Code: ${data.returnCode || 'Exit 0, executado com sucesso. Exit diferente de 0 é erro'}</td>
                </tr>
                <tr>
                    <td colspan="2">E-mail destino para notificação: ${data.emailNotification || ''}</td>
                </tr>
                <tr>
                    <td colspan="2">
                        <strong>Observação:</strong><br>
                        ${data.observations || 'O Param3 DATA é opcional e deve ser preenchido em casos de execuções retroativas.<br>&lt;DATA&gt;: O parâmetro de data tem formato AAAAMMDD.'}
                    </td>
                </tr>
                <tr>
                    <td>Executor: ${data.executor || ''}</td>
                    <td>Data de Execução: ${data.executionDate || ''}</td>
                </tr>
                <tr>
                    <td>Aprovador: ${data.approver || ''}</td>
                    <td>Data de Aprovação: ${data.approvalDate || ''}</td>
                </tr>
            </table>
        </body>
        </html>
        `;
    }
    
    // Função para mostrar mensagem de sucesso
    function showSuccessMessage(message) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #10b981;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-line;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <i class="fas fa-check-circle" style="color: white; font-size: 18px; margin-top: 2px;"></i>
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">Sucesso!</div>
                    <div>${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Função para mostrar mensagem de erro
    function showErrorMessage(message) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ef4444;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-line;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <i class="fas fa-exclamation-circle" style="color: white; font-size: 18px; margin-top: 2px;"></i>
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">Erro!</div>
                    <div>${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover automaticamente após 8 segundos (mais tempo para erros)
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }
});