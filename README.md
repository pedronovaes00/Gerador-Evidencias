#Rodando

Push-Location "C:\Users\pedro.novaes\OneDrive - Accenture\Documentação(QA)\Gerador de Evidências de teste_Pedro\Gerador de Evidências de teste"; python app.py

## 🚀 Funcionalidades

### 1. Gerador de Evidências de Teste
- Cadastro e gerenciamento de informações do testador
- Criação e edição de casos de teste
- Upload de evidências (capturas de tela)
- Geração de relatórios em PDF com evidências
- Histórico completo de testes executados

### 2. Gerador de DOCJOBS BRM
- Interface para preenchimento de dados de jobs
- Geração automática de documentos .docx formatados
- Template padronizado para cadastro no Control-M
- Download direto dos documentos gerados

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3.x com Flask
- **Banco de Dados**: SQLite com SQLAlchemy
- **Frontend**: HTML, CSS (Tailwind CSS) e JavaScript
- **Geração de PDF**: ReportLab
- **Geração de DOCX**: python-docx
- **Outras bibliotecas**: Werkzeug, Jinja2, Pillow

## 📋 Requisitos do Sistema

- Python 3.x
- Pip (gerenciador de pacotes do Python)
- Navegador web moderno

## ⚙️ Instalação

### 1. Clone ou baixe este repositório

```bash
git clone [URL_DO_REPOSITÓRIO]
```

Ou baixe e extraia o arquivo ZIP do projeto.

### 2. Instale as dependências

Navegue até a pasta do projeto e execute:

```bash
pip install -r requirements.txt
```

Isto instalará todas as bibliotecas necessárias:
- Flask==2.3.2
- Flask-SQLAlchemy==3.0.5
- python-docx==1.2.0
- reportlab==4.2.2
- Pillow==10.4.0
- Werkzeug==2.3.6

## 🚀 Executando a Aplicação

### Method 1: Using the Virtual Environment (Recommended)

If you've already set up the virtual environment at `C:\venv_temp`, run:
 
 cd "C:\Users\pedro.novaes\OneDrive - Accenture\Documentação(QA)\Gerador de Evidências de teste_Pedro\Gerador de Evidências de teste" ; python app.py

Then open your browser and navigate to:
```
http://127.0.0.1:5000
```

### Method 2: Using System Python

If you have Python installed globally, navigate to the project folder and run:

```bash
python app.py
```

Then open your browser and navigate to:
```
http://127.0.0.1:5001
```

### Method 3: PowerShell Command (Windows)

Run the following command from anywhere in PowerShell:

```powershell
Push-Location "C:\Users\pedro.novaes\OneDrive - Accenture\Documentação(QA)\Gerador de Evidências de teste_Pedro\Gerador de Evidências de teste"; python app.py
```

Once the server starts, open your browser and navigate to:
```
http://127.0.0.1:5000
```

## 📖 Guia de Uso

### 🧪 Gerador de Evidências de Teste

#### 1. Configuração Inicial
Ao acessar o sistema pela primeira vez:

1. Preencha as **Informações do Testador**:
   - **Identificação**: ID e descrição da origem do teste
   - **Tipo de Teste**: Funcional, Regressão, etc.
   - **Sistemas**: Sistemas envolvidos no teste
   - **Ambiente**: Produção, Homologação, etc.
   - **Dados Pessoais**: Nome, papel, empresa, e-mail
   - **Sumário**: Descrição geral do que está sendo testado

2. Clique em **"Salvar Informações do Testador"**

#### 2. Cadastro de Testes

1. Preencha:
   - **ID do Caso de Teste**: Identificador único
   - **Descrição**: Detalhamento do teste
   - **Pré-condições**: Requisitos para execução
   - **Responsável**: Pessoa responsável pelo teste
   - **Status**: Sucesso, Falha, etc.

2. Clique em **"Salvar Teste"**

#### 3. Upload de Evidências

1. Após salvar um teste, use o botão **"Escolher Arquivo"**
2. Selecione uma imagem (PNG, JPG, etc.)
3. Clique em **"Enviar"**
4. Repita para múltiplas evidências

#### 4. Geração de PDF

1. Selecione os testes desejados na lista
2. Clique em **"Gerar PDF"**
3. O relatório será gerado e baixado automaticamente

### 📄 Gerador de DOCJOBS BRM

#### 1. Acesso à Funcionalidade

- Use o **botão flutuante (FAB)** no canto inferior direito
- Selecione **"Gerador de DOCJOBS BRM"**
- Ou acesse diretamente: `http://127.0.0.1:5000/docjobs.html`

#### 2. Preenchimento do Formulário

Preencha os campos organizados por seções:

**Informações Básicas:**
- Número da SM
- Número do Chamado
- Solicitante e Telefone
- Datas de solicitação e limite
- Assunto e Impacto do Negócio

**Informações Gerais:**
- Nome do Job
- Owner
- Nome do Shell e Path
- Servidor e IP
- Descrição do Job

**Frequência de Execução:**
- Tipo (Diário/Mensal)
- Horários de início e fim
- Dias da semana
- Detalhamento da frequência (campo personalizado)

**Condições:**
- Processos antecessores e sucessores

**Recursos:**
- Configurações de execução paralela
- Nomes dos processos

**Parâmetros:**
- Parm1 a Parm8 (conforme necessário)

**Configurações Finais:**
- Return Code
- E-mail para notificação
- Observações
- Assinaturas (Executor e Aprovador)

#### 3. Geração do Documento

1. Clique em **"Gerar Documento"**
2. O sistema criará um arquivo .docx formatado
3. O download iniciará automaticamente
4. O arquivo será salvo em `docjobs/gerados/`

## 📁 Estrutura do Projeto

```
.
├── app.py                          # Aplicação Flask principal
├── docjobs_template_processor.py   # Processador de templates DOCJOBS
├── requirements.txt                 # Dependências do projeto
├── README.md                       # Este arquivo
│
├── templates/                      # Templates HTML
│   ├── index.html                 # Página principal (Evidências)
│   ├── docjobs.html              # Gerador de DOCJOBS
│   └── document_template.html     # Template para PDF
│
├── static/                        # Arquivos estáticos
│   ├── css/
│   │   ├── custom.css            # Estilos personalizados
│   │   └── fab.css               # Estilos do botão flutuante
│   ├── js/
│   │   ├── main.js               # JavaScript principal
│   │   ├── fab.js                # Lógica do botão flutuante
│   │   └── docjobs.js            # JavaScript do DOCJOBS
│   ├── img/
│   │   └── vivo-logo.svg         # Logo da empresa
│   └── pdfs/                     # PDFs gerados
│
├── docjobs/                       # Arquivos DOCJOBS
│   ├── c_alarmes_valida_selecao_arrecadado.docx  # Template base
│   └── gerados/                  # Documentos gerados
│
├── uploads/                       # Evidências de teste
├── instance/                      # Banco de dados
│   └── tests.db
└── __pycache__/                   # Cache do Python
```

## 🗄️ Modelos de Dados

### TestInfo
Informações do testador e contexto geral:
- `origin_id`: ID da origem
- `origin_description`: Descrição da origem
- `test_type`: Tipo de teste
- `systems`: Sistemas envolvidos
- `environment`: Ambiente de teste
- `tester_name`: Nome do testador
- `role`: Papel/função
- `company`: Empresa
- `email`: E-mail
- `summary`: Sumário do teste

### TestExecution
Informações de cada execução de teste:
- `test_id`: ID do teste
- `description`: Descrição
- `preconditions`: Pré-condições
- `evidence_filenames`: Arquivos de evidência (JSON)
- `responsible`: Responsável
- `status`: Status do teste
- `error_description`: Descrição de erro
- `error_correction`: Correção aplicada
- `current_status`: Status atual

## 🔧 APIs Disponíveis

### Evidências de Teste
- `GET /` - Página principal
- `POST /api/test-info` - Salvar informações do testador
- `GET /api/test-info` - Obter informações do testador
- `GET /api/tests` - Listar todos os testes
- `POST /api/tests` - Criar novo teste
- `PUT /api/tests/<id>` - Atualizar teste
- `DELETE /api/tests/<id>` - Excluir teste
- `POST /api/upload/<test_id>` - Upload de evidência
- `GET /api/generate-pdf` - Gerar PDF
- `GET /api/pdfs` - Listar PDFs gerados

### DOCJOBS
- `GET /docjobs.html` - Interface do DOCJOBS
- `POST /api/generate-docjobs` - Gerar documento DOCJOBS
- `GET /docjobs/<filename>` - Download de documento

## 🧪 Funcionalidades Especiais

### Campo "Detalhamento da Frequência"
O sistema possui lógica inteligente para o campo de frequência:
- **Input do usuário**: Se preenchido, mantém o valor exato
- **Geração automática**: Se vazio, gera baseado no tipo e dias selecionados
- **Limpeza**: Remove espaços extras automaticamente

### Botão de Ação Flutuante (FAB)
Navegação rápida entre funcionalidades:
- Gerador de Evidências de Teste
- Gerador de DOCJOBS BRM

### Validação de Dados
- Campos obrigatórios validados
- Formatos de arquivo verificados
- Tratamento robusto de erros

## 🔍 Solução de Problemas

### Problemas Comuns

1. **Erro ao instalar dependências**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. **Banco de dados corrompido**
   - Delete o arquivo `instance/tests.db`
   - Reinicie a aplicação

3. **Problemas de permissão**
   - Verifique permissões das pastas `uploads/` e `static/pdfs/`
   - Execute como administrador se necessário

4. **Erro na geração de DOCJOBS**
   - Verifique se a pasta `docjobs/gerados/` existe
   - Confirme se todos os campos obrigatórios estão preenchidos

### Logs e Debug

O sistema gera logs detalhados no console. Para debug:

```bash
python app.py
```

Observe as mensagens de erro no terminal.

## 🔒 Segurança

- Upload de arquivos com validação de tipo
- Sanitização de nomes de arquivo
- Proteção contra injeção SQL (SQLAlchemy ORM)
- Validação de dados de entrada

## 📈 Melhorias Futuras

- [ ] Autenticação de usuários
- [ ] Backup automático do banco de dados
- [ ] Integração com sistemas externos
- [ ] Relatórios avançados
- [ ] API REST completa
- [ ] Interface mobile responsiva

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs no console
2. Confirme se todas as dependências estão instaladas
3. Teste com dados de exemplo
4. Consulte a documentação das bibliotecas utilizadas

---

**Desenvolvido para otimizar o processo de documentação de testes e geração de DOCJOBS no ambiente BRM.**