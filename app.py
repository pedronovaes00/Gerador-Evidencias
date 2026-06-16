import sys
import io
# Forçar UTF-8 no terminal do Windows para suporte a emojis
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
import os
import threading
import webbrowser
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import mimetypes

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    stream=sys.stdout
)

app = Flask(__name__)

# Configurações via ambiente com fallback
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'change-me-in-production')
app.config['FLASK_HOST'] = os.getenv('FLASK_HOST', '0.0.0.0')

UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(BASE_DIR, 'uploads'))
INSTANCE_FOLDER = os.getenv('INSTANCE_FOLDER', os.path.join(BASE_DIR, 'instance'))
PDF_FOLDER = os.getenv('PDF_FOLDER', os.path.join(BASE_DIR, 'static', 'pdfs'))
DOCJOBS_FOLDER = os.getenv('DOCJOBS_FOLDER', os.path.join(BASE_DIR, 'docjobs'))

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INSTANCE_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)
os.makedirs(os.path.join(DOCJOBS_FOLDER, 'gerados'), exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    f'sqlite:///{os.path.join(INSTANCE_FOLDER, "tests.db")}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar o banco de dados
db = SQLAlchemy(app)

# Modelo de dados para as informações do testador e do teste
class TestInfo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    origin_id = db.Column(db.String(100), nullable=False)
    origin_description = db.Column(db.Text, nullable=False)
    test_type = db.Column(db.String(100), nullable=False, default='Funcional')
    systems = db.Column(db.String(255), nullable=False)
    environment = db.Column(db.String(255), nullable=True)
    tester_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100), nullable=False, default='QA')
    company = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'origin_id': self.origin_id,
            'origin_description': self.origin_description,
            'test_type': self.test_type,
            'systems': self.systems,
            'environment': self.environment,
            'tester_name': self.tester_name,
            'role': self.role,
            'company': self.company,
            'email': self.email,
            'summary': self.summary,
            'created_at': self.created_at.strftime('%d/%m/%Y %H:%M:%S')
        }

# Modelo de dados para os testes
class TestExecution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    preconditions = db.Column(db.Text, nullable=True)
    evidence_filenames = db.Column(db.Text, nullable=True)  # Armazenará múltiplos nomes de arquivo como JSON
    responsible = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), nullable=True, default='success')
    error_description = db.Column(db.Text, nullable=True)
    error_correction = db.Column(db.Text, nullable=True)
    current_status = db.Column(db.String(255), nullable=True)
    display_order = db.Column(db.Integer, nullable=True)  # Ordem de exibição para drag-and-drop
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        import json
        # Converter a string JSON para lista ou retornar lista vazia se for None
        evidence_list = json.loads(self.evidence_filenames) if self.evidence_filenames else []
        # Garantir que created_at nunca seja nulo
        if self.created_at:
            created_at_str = self.created_at.strftime('%d/%m/%Y %H:%M:%S')
        else:
            created_at_str = 'Data desconhecida'
        return {
            'id': self.id,
            'test_id': self.test_id,
            'description': self.description,
            'preconditions': self.preconditions,
            'evidence_filenames': evidence_list,
            'responsible': self.responsible,
            'status': self.status,
            'error_description': self.error_description,
            'error_correction': self.error_correction,
            'current_status': self.current_status,
            'display_order': self.display_order,
            'created_at': created_at_str
        }

# Criar pasta de uploads se não existir
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Tipos de arquivo permitidos
ALLOWED_EXTENSIONS = {
    # Imagens
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'svg',
    # Documentos
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp',
    # Vídeos
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v',
    # Áudio
    'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma',
    # Arquivos compactados
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    # Outros
    'csv', 'json', 'xml', 'log'
}

ALLOWED_MIME_TYPES = {
    # Imagens
    'image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp', 'image/svg+xml',
    # Documentos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.presentation',
    # Vídeos
    'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska',
    # Áudio
    'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/ogg', 'audio/x-ms-wma',
    # Arquivos compactados
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/x-tar', 'application/gzip', 'application/x-bzip2',
    # Outros
    'text/csv', 'application/json', 'application/xml', 'text/x-log'
}

def allowed_file(filename):
    """Verifica se o arquivo tem uma extensão permitida"""
    if '.' not in filename:
        return False
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS

def allowed_mime_type(file):
    """Verifica se o arquivo tem um tipo MIME permitido"""
    # Tentar detectar o tipo MIME do arquivo
    mime_type, _ = mimetypes.guess_type(file.filename)
    if mime_type:
        return mime_type in ALLOWED_MIME_TYPES
    
    # Se não conseguir detectar pelo nome, tentar pelo conteúdo
    try:
        # Ler os primeiros bytes para detectar o tipo
        file.seek(0)
        header = file.read(512)
        file.seek(0)
        
        # Verificações básicas por assinatura de arquivo
        if header.startswith(b'\x89PNG'):
            return 'image/png' in ALLOWED_MIME_TYPES
        elif header.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg' in ALLOWED_MIME_TYPES
        elif header.startswith(b'%PDF'):
            return 'application/pdf' in ALLOWED_MIME_TYPES
        elif header.startswith(b'PK\x03\x04'):
            return 'application/zip' in ALLOWED_MIME_TYPES
    except:
        pass
    
    return False

def get_file_type(filename):
    """Detecta o tipo de arquivo baseado na extensão"""
    if not filename:
        return 'unknown'
    
    extension = filename.lower().split('.')[-1] if '.' in filename else ''
    
    # Tipos de imagem
    image_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'svg'}
    if extension in image_extensions:
        return 'image'
    
    # Documentos
    document_extensions = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'}
    if extension in document_extensions:
        return 'document'
    
    # Vídeos
    video_extensions = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'}
    if extension in video_extensions:
        return 'video'
    
    # Áudios
    audio_extensions = {'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'}
    if extension in audio_extensions:
        return 'audio'
    
    # Arquivos comprimidos
    archive_extensions = {'zip', 'rar', '7z', 'tar', 'gz', 'bz2'}
    if extension in archive_extensions:
        return 'archive'
    
    # Outros
    other_extensions = {'csv', 'json', 'xml', 'log'}
    if extension in other_extensions:
        return 'data'
    
    return 'unknown'

def get_file_icon_for_pdf(file_type):
    """Retorna um ícone/símbolo para representar o tipo de arquivo no PDF"""
    icons = {
        'image': '🖼️',
        'document': '📄',
        'video': '🎥',
        'audio': '🎵',
        'archive': '📦',
        'data': '📊',
        'unknown': '📎'
    }
    return icons.get(file_type, '📎')

# Criar o banco de dados se não existir
with app.app_context():
    import os
    # Forçar recriação do banco se a estrutura mudou
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'tests.db')
    try:
        # Tentar criar as tabelas
        db.create_all()
        print("✅ Banco de dados criado/atualizado com sucesso!")
    except Exception as e:
        # Se houver erro de estrutura, deletar e recriar
        print(f"⚠️ Erro ao criar banco: {e}")
        print("🔄 Recriando banco de dados...")
        if os.path.exists(db_path):
            os.remove(db_path)
            print("🗑️ Banco antigo removido")
        db.create_all()
        print("✅ Novo banco criado com sucesso!")

@app.route('/')
@app.route('/index.html')
def index():
    # Verificar se já existe informação do testador
    test_info = TestInfo.query.order_by(TestInfo.id.desc()).first()
    return render_template('index.html', test_info=test_info)

@app.route('/api/test-info', methods=['POST'])
def create_test_info():
    if 'Content-Type' not in request.headers or request.headers['Content-Type'] != 'application/json':
        return {'error': 'Content-Type deve ser application/json'}, 415
        
    try:
        data = request.get_json()
        if not data:
            return {'error': 'Dados JSON inválidos ou vazios'}, 400
            
        # Criar ou atualizar as informações do testador
        test_info = TestInfo.query.order_by(TestInfo.id.desc()).first()
        
        if test_info:
            # Atualizar informações existentes
            test_info.origin_id = data.get('originId', '')
            test_info.origin_description = data.get('originDescription', '')
            test_info.test_type = data.get('testType', 'Funcional')
            test_info.systems = data.get('systems', '')
            test_info.environment = data.get('environment', '')
            test_info.tester_name = data.get('testerName', '')
            test_info.role = data.get('role', 'QA')
            test_info.company = data.get('company', '')
            test_info.email = data.get('email', '')
            test_info.summary = data.get('summary', '')
        else:
            # Criar novas informações
            test_info = TestInfo(
                origin_id=data.get('originId', ''),
                origin_description=data.get('originDescription', ''),
                test_type=data.get('testType', 'Funcional'),
                systems=data.get('systems', ''),
                environment=data.get('environment', ''),
                tester_name=data.get('testerName', ''),
                role=data.get('role', 'QA'),
                company=data.get('company', ''),
                email=data.get('email', ''),
                summary=data.get('summary', '')
            )
            db.session.add(test_info)
        
        db.session.commit()
        
        return {'message': 'Informações do testador salvas com sucesso', 'data': test_info.to_dict()}, 201
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro ao processar JSON: ' + str(e)}, 400

@app.route('/api/test-info', methods=['GET'])
def get_test_info():
    # Buscar as informações do testador mais recentes
    test_info = TestInfo.query.order_by(TestInfo.id.desc()).first()
    
    if test_info:
        return jsonify(test_info.to_dict())
    else:
        return jsonify({})

@app.route('/api/tests', methods=['GET'])
def get_tests():
    # Buscar todos os testes no banco de dados, ordenados por display_order (com fallback para id)
    tests = TestExecution.query.order_by(TestExecution.display_order.is_(None), TestExecution.display_order, TestExecution.id).all()
    return jsonify([test.to_dict() for test in tests])

@app.route('/api/tests', methods=['POST'])
def create_test():
    if 'Content-Type' not in request.headers or request.headers['Content-Type'] != 'application/json':
        return {'error': 'Content-Type deve ser application/json'}, 415
        
    try:
        data = request.get_json()
        if not data:
            return {'error': 'Dados JSON inválidos ou vazios'}, 400
        
        # Usar o responsável enviado pelo cliente ou obter do banco de dados
        responsible = data.get('responsible')
        
        # Se não foi enviado, usar o nome do testador como fallback
        if not responsible:
            test_info = TestInfo.query.order_by(TestInfo.id.desc()).first()
            responsible = test_info.tester_name if test_info else 'Testador'
            
        # Criar um novo teste no banco de dados
        import json
        new_test = TestExecution(
            test_id=data.get('test_id', ''),
            description=data.get('description', ''),
            preconditions=data.get('preconditions', ''),
            responsible=responsible,
            status=data.get('status', 'success'),
            error_description=data.get('error_description', ''),
            error_correction=data.get('error_correction', ''),
            current_status=data.get('current_status', 'N/A'),
            evidence_filenames=json.dumps([])  # Inicializar como uma lista vazia em formato JSON
        )
        
        db.session.add(new_test)
        db.session.commit()
        
        return {'message': 'Teste criado com sucesso', 'data': new_test.to_dict()}, 201
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro ao processar JSON: ' + str(e)}, 400

@app.route('/api/tests/<test_id>', methods=['GET', 'PUT'])
def update_test(test_id):
    # Buscar o teste pelo ID
    test = TestExecution.query.get(test_id)
    
    if not test:
        return {'error': 'Teste não encontrado'}, 404
    
    # Se for GET, retornar os dados do teste
    if request.method == 'GET':
        return jsonify(test.to_dict())
    
    # Se for PUT, atualizar o teste
    try:
        data = request.get_json()
        if not data:
            return {'error': 'Dados JSON inválidos ou vazios'}, 400
            
        # Atualizar os campos do teste
        if 'test_id' in data:
            test.test_id = data['test_id']
        if 'description' in data:
            test.description = data['description']
        if 'preconditions' in data:
            test.preconditions = data['preconditions']
        if 'responsible' in data:
            test.responsible = data['responsible']
        if 'status' in data:
            test.status = data['status']
        if 'error_description' in data:
            test.error_description = data['error_description']
        if 'error_correction' in data:
            test.error_correction = data['error_correction']
        if 'current_status' in data:
            test.current_status = data['current_status']
        
        # Atualizar as evidências, se fornecidas
        if 'evidence_filenames' in data:
            import json
            test.evidence_filenames = json.dumps(data['evidence_filenames'])
            
        db.session.commit()
        
        return {'message': 'Teste atualizado com sucesso', 'data': test.to_dict()}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro ao atualizar teste: ' + str(e)}, 500

@app.route('/api/tests/<test_id>', methods=['DELETE'])
def delete_test(test_id):
    try:
        # Buscar o teste pelo ID
        test = TestExecution.query.get(test_id)
        
        if not test:
            return {'error': 'Teste não encontrado'}, 404
            
        # Deletar o teste
        db.session.delete(test)
        db.session.commit()
        
        return {'message': 'Teste deletado com sucesso', 'test_id': test_id}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro ao deletar teste: ' + str(e)}, 500

@app.route('/api/tests/delete-all', methods=['DELETE'])
def delete_all_tests():
    try:
        # Deletar todos os testes
        tests = TestExecution.query.all()
        
        if not tests:
            return {'message': 'Não há testes para excluir'}, 200
            
        for test in tests:
            db.session.delete(test)
            
        db.session.commit()
        
        return {'message': 'Todos os testes foram excluídos com sucesso'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro ao excluir todos os testes: ' + str(e)}, 500

@app.route('/api/tests/reorder', methods=['POST'])
def reorder_tests():
    """Endpoint para reordenar os testes via drag-and-drop"""
    if 'Content-Type' not in request.headers or request.headers['Content-Type'] != 'application/json':
        return {'error': 'Content-Type deve ser application/json'}, 415
    
    try:
        data = request.get_json()
        if not data or 'test_ids' not in data:
            return {'error': 'Dados inválidos. Esperado: {"test_ids": [...]}'}, 400
        
        test_ids = data.get('test_ids', [])
        
        # Atualizar o display_order para cada teste
        for index, test_id in enumerate(test_ids):
            test = TestExecution.query.get(test_id)
            if test:
                test.display_order = index
        
        db.session.commit()
        return {'message': 'Ordem dos testes atualizada com sucesso'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro ao reordenar testes: ' + str(e)}, 500

@app.route('/api/upload/<int:test_id>', methods=['POST'])
def upload_file(test_id):
    if 'file' not in request.files:
        return {'error': 'Nenhum arquivo enviado'}, 400
    
    file = request.files['file']
    if file.filename == '':
        return {'error': 'Nome de arquivo vazio'}, 400
    
    # Validar tipo de arquivo
    if not allowed_file(file.filename):
        extensoes_permitidas = ', '.join(sorted(ALLOWED_EXTENSIONS))
        return {'error': f'Tipo de arquivo não permitido. Extensões aceitas: {extensoes_permitidas}'}, 400
    
    if not allowed_mime_type(file):
        return {'error': 'Tipo de arquivo não permitido ou arquivo corrompido'}, 400
    
    # Obter o teste específico pelo ID fornecido
    test_execution = TestExecution.query.get(test_id)
    
    if test_execution and file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Atualizar o teste com o nome do arquivo de evidência
        import json
        # Carregar a lista atual de evidências ou criar uma nova lista vazia
        evidence_list = json.loads(test_execution.evidence_filenames) if test_execution.evidence_filenames else []
        # Adicionar o novo arquivo à lista
        evidence_list.append(filename)
        # Salvar a lista atualizada como JSON
        test_execution.evidence_filenames = json.dumps(evidence_list)
        db.session.commit()
        
        return {'message': 'Arquivo enviado com sucesso', 'filename': filename, 'test_id': test_execution.id}, 201
    
    return {'error': 'Não foi possível associar o arquivo a um teste'}, 400

@app.route('/api/upload-to-test', methods=['POST'])
def upload_file_to_test():
    if 'file' not in request.files:
        return {'error': 'Nenhum arquivo enviado'}, 400
    
    file = request.files['file']
    if file.filename == '':
        return {'error': 'Nome de arquivo vazio'}, 400
    
    # Validar tipo de arquivo
    if not allowed_file(file.filename):
        extensoes_permitidas = ', '.join(sorted(ALLOWED_EXTENSIONS))
        return {'error': f'Tipo de arquivo não permitido. Extensões aceitas: {extensoes_permitidas}'}, 400
    
    if not allowed_mime_type(file):
        return {'error': 'Tipo de arquivo não permitido ou arquivo corrompido'}, 400
    
    # Obter o ID do teste específico
    test_id = request.form.get('test_id')
    if not test_id:
        return {'error': 'ID do teste não fornecido'}, 400
    
    # Buscar o teste pelo ID
    test = TestExecution.query.get(test_id)
    if not test:
        return {'error': 'Teste não encontrado'}, 404
    
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Atualizar o teste com o nome do arquivo de evidência
        import json
        # Carregar a lista atual de evidências ou criar uma nova lista vazia
        evidence_list = json.loads(test.evidence_filenames) if test.evidence_filenames else []
        # Adicionar o novo arquivo à lista
        evidence_list.append(filename)
        # Salvar a lista atualizada como JSON
        test.evidence_filenames = json.dumps(evidence_list)
        db.session.commit()
        
        return {'message': 'Arquivo enviado com sucesso', 'filename': filename, 'test_id': test.id}, 201
    
    return {'error': 'Não foi possível fazer upload do arquivo'}, 400

@app.route('/api/generate-pdf', methods=['GET', 'POST'])
def generate_pdf():
    try:
        import io
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch, cm
        
        if request.method == 'POST':
            # Obter os IDs dos testes selecionados
            data = request.get_json()
            test_ids = data.get('test_ids', [])
            
            # Filtrar apenas os testes selecionados, ordenados por display_order (com fallback para id)
            executions = TestExecution.query.filter(TestExecution.id.in_(test_ids)).order_by(TestExecution.display_order.is_(None), TestExecution.display_order, TestExecution.id).all()
        else:
            # Se for GET, buscar todos os testes, ordenados por display_order (com fallback para id)
            executions = TestExecution.query.order_by(TestExecution.display_order.is_(None), TestExecution.display_order, TestExecution.id).all()
        
        # Preparar os dados para o template
        executions_data = []
        for execution in executions:
            execution_dict = execution.to_dict()
            # Adicionar caminho absoluto para as imagens de evidência, se existirem
            if execution_dict.get('evidence_filenames'):
                execution_dict['evidence_path'] = True  # Marcador para indicar que há evidências
            executions_data.append(execution_dict)
        
        # Obter dados do testador do banco de dados
        test_info = TestInfo.query.order_by(TestInfo.id.desc()).first()
        
        # Dados básicos do documento
        if test_info:
            test_data = test_info.to_dict()
        else:
            # Dados padrão caso não haja informações do testador
            test_data = {
                'origin_id': 'Múltiplos IDs',
                'origin_description': 'Documento de Evidências de Teste',
                'test_type': 'Funcional',
                'systems': 'Sistema de Testes',
                'tester_name': 'Testador',
                'company': 'Empresa',
                'email': 'email@exemplo.com',
                'summary': 'Resumo das execuções de teste realizadas.'
            }
        
        # Criar um buffer para o PDF
        buffer = io.BytesIO()
        
        # Criar o documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        
        # Estilos para o documento
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Center', alignment=1))
        # Adicionar estilo para células de tabela com quebra de linha
        styles.add(ParagraphStyle(
            name='TableCell',
            parent=styles['Normal'],
            wordWrap='CJK',
            alignment=0,
            spaceBefore=0,
            spaceAfter=0,
            leading=12
        ))
        
        # Lista de elementos para o PDF
        elements = []
        
        # Título do documento
        title = Paragraph("<b>Documento de Evidências de Teste (DET)</b>", styles['Heading1'])
        elements.append(title)
        
        # Data de geração
        current_date = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        date_paragraph = Paragraph(f"Gerado em {current_date}", styles['Center'])
        elements.append(date_paragraph)
        elements.append(Spacer(1, 0.5*inch))
        
        # Seção 1: Identificação
        elements.append(Paragraph("<b>1. Identificação</b>", styles['Heading2']))
        data = [
            [Paragraph("ID(s) da Origem", styles['TableCell']), Paragraph(test_data['origin_id'], styles['TableCell'])],
            [Paragraph("Nome/Breve Descrição da Origem", styles['TableCell']), Paragraph(test_data['origin_description'], styles['TableCell'])]
        ]
        t = Table(data, colWidths=[doc.width/3, doc.width*2/3])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 8)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.3*inch))
        
        # Seção 2: Identificação do Teste
        elements.append(Paragraph("<b>2. Identificação do Teste</b>", styles['Heading2']))
        data = [
            [Paragraph("Tipo de Teste", styles['TableCell']), Paragraph(test_data['test_type'], styles['TableCell'])],
            [Paragraph("Sistema(s)", styles['TableCell']), Paragraph(test_data['systems'], styles['TableCell'])],
            [Paragraph("Ambiente", styles['TableCell']), Paragraph(test_data.get('environment', 'N/A'), styles['TableCell'])]
        ]
        t = Table(data, colWidths=[doc.width/3, doc.width*2/3])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 8)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.3*inch))
        
        # Seção 3: Envolvidos
        elements.append(Paragraph("<b>3. Envolvidos</b>", styles['Heading2']))
        data = [
            [Paragraph("Nome Completo", styles['TableCell']), Paragraph("Papel", styles['TableCell']), 
             Paragraph("Empresa/Área", styles['TableCell']), Paragraph("E-mail", styles['TableCell'])],
            [Paragraph(test_data['tester_name'], styles['TableCell']), Paragraph("QA", styles['TableCell']), 
             Paragraph(test_data['company'], styles['TableCell']), Paragraph(test_data['email'], styles['TableCell'])]
        ]
        t = Table(data, colWidths=[doc.width/4, doc.width/4, doc.width/4, doc.width/4])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 8)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.3*inch))
        
        # Seção 4: Sumário
        elements.append(Paragraph("<b>4. Sumário</b>", styles['Heading2']))
        elements.append(Paragraph(test_data['summary'], styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Seção 5: Evolução dos Testes
        elements.append(Paragraph("<b>5. Cenário de Teste</b>", styles['Heading2']))
        
        # Adicionar cada execução de teste
        for execution in executions_data:
            test_number = execution.get('test_id', str(execution['id'])).zfill(2)
            elements.append(Paragraph(f"<b>Teste {test_number}</b>", styles['Heading3']))
            
            data = [
                [Paragraph("ID", styles['TableCell']), Paragraph(str(execution['id']), styles['TableCell'])],
                [Paragraph("Nome do Caso de Teste", styles['TableCell']), Paragraph(f"{test_number}", styles['TableCell'])],
                [Paragraph("Descrição do Caso de Teste", styles['TableCell']), Paragraph(execution['description'], styles['TableCell'])],
                [Paragraph("Pré-Condições", styles['TableCell']), Paragraph(execution.get('preconditions', 'N/A'), styles['TableCell'])],
                [Paragraph("Situação Atual", styles['TableCell']), Paragraph(execution.get('current_status', 'N/A'), styles['TableCell'])],
                [Paragraph("Status", styles['TableCell']), Paragraph(execution.get('status', 'Executado'), styles['TableCell'])],
                [Paragraph("Resultados Obtidos", styles['TableCell']), Paragraph('Teste executado com erro' if execution.get('status', '').lower() == 'error' else execution.get('results', 'Teste executado conforme esperado'), styles['TableCell'])],
                [Paragraph("Responsável pelo Teste", styles['TableCell']), Paragraph(execution.get('responsible', 'Testador'), styles['TableCell'])],
                [Paragraph("Data do Teste", styles['TableCell']), Paragraph(execution.get('created_at', execution.get('test_date', 'N/A')), styles['TableCell'])]
            ]
            
            # Adicionar descrição do erro e correção do defeito se o status for diferente de 'success'
            if execution.get('status', '').lower() != 'success':
                if execution.get('error_description'):
                    data.append([Paragraph("Descrição do Erro", styles['TableCell']), Paragraph(execution.get('error_description', 'N/A'), styles['TableCell'])])
                if execution.get('error_correction'):
                    data.append([Paragraph("Correção do Defeito", styles['TableCell']), Paragraph(execution.get('error_correction', 'N/A'), styles['TableCell'])])
            
            t = Table(data, colWidths=[doc.width/3, doc.width*2/3])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (1, 0), (1, -1), 10),  # Adiciona mais padding à esquerda para a segunda coluna
                ('RIGHTPADDING', (1, 0), (1, -1), 10)  # Adiciona mais padding à direita para a segunda coluna
            ]))
            elements.append(t)
            
            # Adicionar evidências, se existirem
            if 'evidence_path' in execution and execution.get('evidence_filenames'):
                # Adicionar espaço antes da seção de evidências
                elements.append(Spacer(1, 0.3*inch))
                elements.append(Paragraph("Anexos/Caminhos das Evidências:", styles['Normal']))
                
                for idx, filename in enumerate(execution['evidence_filenames']):
                    try:
                        file_path = os.path.join(os.path.abspath(app.config['UPLOAD_FOLDER']), filename)
                        file_type = get_file_type(filename)
                        file_icon = get_file_icon_for_pdf(file_type)
                        
                        # Adicionar espaço antes da evidência
                        elements.append(Spacer(1, 0.1*inch))
                        
                        # Se for imagem, tentar renderizar
                        if file_type == 'image':
                            try:
                                img = Image(file_path)
                                # Redimensionar a imagem se for muito grande
                                max_width = doc.width
                                max_height = 4 * inch
                                if img.drawWidth > max_width or img.drawHeight > max_height:
                                    ratio = min(max_width / img.drawWidth, max_height / img.drawHeight)
                                    img.drawWidth *= ratio
                                    img.drawHeight *= ratio
                                
                                # Adicionar título da imagem
                                elements.append(Paragraph(f"Evidência {idx+1} {file_icon}: {filename}", styles['Normal']))
                                elements.append(Spacer(1, 0.1*inch))
                                elements.append(img)
                                elements.append(Spacer(1, 0.2*inch))
                            except Exception as img_error:
                                # Se falhar ao carregar como imagem, tratar como arquivo comum
                                elements.append(Paragraph(f"Evidência {idx+1} {file_icon}: {filename}", styles['Normal']))
                                elements.append(Paragraph(f"Caminho: {file_path}", styles['Normal']))
                                elements.append(Paragraph(f"Tipo: {file_type.title()}", styles['Normal']))
                                elements.append(Paragraph(f"Nota: Arquivo anexado ao projeto (erro ao renderizar: {str(img_error)})", styles['Normal']))
                        else:
                            # Para outros tipos de arquivo, criar link clicável
                            file_url = f"http://127.0.0.1:5001/uploads/{filename}"
                            
                            elements.append(Paragraph(f"Evidência {idx+1} {file_icon}: {filename}", styles['Normal']))
                            
                            # Criar link clicável para download
                            from reportlab.platypus import Paragraph
                            from reportlab.lib.styles import getSampleStyleSheet
                            
                            link_style = styles['Normal'].clone('LinkStyle')
                            link_style.textColor = 'blue'
                            link_style.underline = True
                            
                            link_text = f'<a href="{file_url}" color="blue">🔗 Clique aqui para baixar o arquivo</a>'
                            elements.append(Paragraph(link_text, link_style))
                            
                            elements.append(Paragraph(f"Tipo: {file_type.title()}", styles['Normal']))
                            
                            # Verificar se o arquivo existe
                            if os.path.exists(file_path):
                                file_size = os.path.getsize(file_path)
                                if file_size < 1024:
                                    size_str = f"{file_size} bytes"
                                elif file_size < 1024 * 1024:
                                    size_str = f"{file_size / 1024:.1f} KB"
                                else:
                                    size_str = f"{file_size / (1024 * 1024):.1f} MB"
                                elements.append(Paragraph(f"Tamanho: {size_str}", styles['Normal']))
                            else:
                                elements.append(Paragraph("Status: Arquivo não encontrado", styles['Normal']))
                            
                            elements.append(Paragraph(f"URL: {file_url}", styles['Normal']))
                            elements.append(Paragraph("Nota: Arquivo anexado ao projeto - clique no link acima para baixar", styles['Normal']))
                        
                        # Espaçamento entre evidências
                        elements.append(Spacer(1, 0.3*inch))
                        
                    except Exception as e:
                        elements.append(Paragraph(f"Erro ao processar evidência {filename}: {str(e)}", styles['Normal']))
                        elements.append(Spacer(1, 0.2*inch))
            
            elements.append(Spacer(1, 0.5*inch))
        
        # Construir o PDF
        doc.build(elements)
        
        # Obter o conteúdo do buffer
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Salvar o PDF
        pdf_path = os.path.join(app.static_folder, 'pdfs')
        if not os.path.exists(pdf_path):
            os.makedirs(pdf_path)

        # Sanitizar caracteres inválidos para nomes de arquivo no Windows
        def _sanitize(s):
            for ch in '/\\:*?"<>|':
                s = s.replace(ch, '-')
            return s.strip()

        safe_origin_id = _sanitize(test_data['origin_id'])
        safe_description = _sanitize(test_data['origin_description'])

        # Calcular orçamento de caracteres respeitando o limite MAX_PATH (260) do Windows
        # Estrutura final: <pdf_path>\DET-[<origin_id>] - <description>.pdf
        MAX_PATH = 260
        SAFETY_MARGIN = 10  # margem de segurança
        FIXED_OVERHEAD = len("DET-[] - .pdf")  # 13 chars fixos do template
        path_overhead = len(pdf_path) + len(os.sep) + FIXED_OVERHEAD + SAFETY_MARGIN

        # Se origin_id sozinho já estourar, truncá-lo também
        max_origin_id_len = 30
        if len(safe_origin_id) > max_origin_id_len:
            safe_origin_id = safe_origin_id[:max_origin_id_len]

        available_for_desc = MAX_PATH - path_overhead - len(safe_origin_id)
        if available_for_desc < 10:
            # Caminho base extremamente longo; fallback drástico
            available_for_desc = 10

        if len(safe_description) > available_for_desc:
            safe_description = safe_description[:max(available_for_desc - 3, 1)] + "..."

        filename = f"DET-[{safe_origin_id}] - {safe_description}.pdf"
        full_path = os.path.join(pdf_path, filename)

        with open(full_path, 'wb') as f:
            f.write(pdf_content)
        
        # Se for uma requisição GET, retornar o arquivo para download
        if request.method == 'GET':
            return send_from_directory(pdf_path, filename, as_attachment=True)
            
        # Se for POST, retornar a URL
        return {'message': 'PDF gerado com sucesso', 'pdf_url': f'/static/pdfs/{filename}'}, 201
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao gerar PDF: {str(e)}")
        print(error_details)
        return {'error': f'Erro ao gerar PDF: {str(e)}'}, 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/pdfs', methods=['GET'])
def get_pdfs():
    """Retorna a lista de PDFs disponíveis na pasta static/pdfs"""
    pdf_path = os.path.join(app.static_folder, 'pdfs')
    if not os.path.exists(pdf_path):
        return jsonify([]), 200
        
    pdf_files = []
    for filename in os.listdir(pdf_path):
        if filename.endswith('.pdf'):
            # Extrair a data do nome do arquivo
            try:
                # Remover a extensão .pdf
                base_name = filename.replace('.pdf', '')
                
                # Procurar por padrões de data no formato YYYYMMDD_HHMMSS
                import re
                date_match = re.search(r'(\d{8})_(\d{6})', base_name)
                
                if date_match:
                    # Extrair data e hora do padrão encontrado
                    date_str = date_match.group(1)  # YYYYMMDD
                    time_str = date_match.group(2)  # HHMMSS
                    
                    year = date_str[:4]
                    month = date_str[4:6]
                    day = date_str[6:8]
                    hour = time_str[:2]
                    minute = time_str[2:4]
                    second = time_str[4:6]
                    
                    formatted_date = f"{day}/{month}/{year} {hour}:{minute}:{second}"
                else:
                    # Tentar obter a data de modificação do arquivo como fallback
                    file_path = os.path.join(pdf_path, filename)
                    mod_time = os.path.getmtime(file_path)
                    formatted_date = datetime.fromtimestamp(mod_time).strftime('%d/%m/%Y %H:%M:%S')
            except Exception as e:
                print(f"Erro ao processar data do arquivo {filename}: {str(e)}")
                formatted_date = "Data desconhecida"
                
            pdf_files.append({
                'filename': filename,
                'url': f'/static/pdfs/{filename}',
                'created_at': formatted_date
            })
    
    # Ordenar por data de criação (mais recente primeiro)
    # Tentar ordenar pela data formatada, se disponível, ou pelo nome do arquivo
    try:
        # Converter a string de data para objeto datetime para ordenação correta
        for pdf in pdf_files:
            if pdf['created_at'] != "Data desconhecida":
                # Converter a data formatada de volta para objeto datetime
                date_obj = datetime.strptime(pdf['created_at'], '%d/%m/%Y %H:%M:%S')
                # Adicionar um campo temporário para ordenação
                pdf['date_obj'] = date_obj
            else:
                # Se a data for desconhecida, usar a data mínima
                pdf['date_obj'] = datetime.min
        
        # Ordenar pela data (mais recente primeiro)
        pdf_files.sort(key=lambda x: x['date_obj'], reverse=True)
        
        # Remover o campo temporário
        for pdf in pdf_files:
            if 'date_obj' in pdf:
                del pdf['date_obj']
    except Exception as e:
        print(f"Erro ao ordenar PDFs por data: {str(e)}")
        # Fallback: ordenar pelo nome do arquivo
        pdf_files.sort(key=lambda x: x['filename'], reverse=True)
    return jsonify(pdf_files), 200

@app.route('/api/pdfs/<filename>', methods=['DELETE'])
def delete_pdf(filename):
    try:
        # Garantir que o nome do arquivo seja seguro
        safe_filename = secure_filename(filename)
        # Corrigir o caminho para a pasta de PDFs
        pdf_path = os.path.join(app.static_folder, 'pdfs')
        file_path = os.path.join(pdf_path, safe_filename)

        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'message': f'Arquivo {safe_filename} excluído com sucesso'}), 200
        else:
            return jsonify({'error': 'Arquivo não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': f'Erro ao excluir arquivo: {str(e)}'}), 500

@app.route('/static/pdfs/<filename>')
def download_pdf(filename):
    """Permite a visualização ou download de um PDF específico"""
    pdf_path = os.path.join(app.static_folder, 'pdfs')
    # Removido o parâmetro as_attachment=True para permitir a visualização no navegador
    return send_from_directory(pdf_path, filename)

@app.route('/docjobs.html')
def docjobs():
    return render_template('docjobs.html')

@app.route('/api/generate-docjobs', methods=['POST'])
def generate_docjobs():
    """Gera documento usando o template .docx existente com substituição de campos"""
    try:
        data = request.get_json()
        print('Dados recebidos:', data)
        if not data:
            return {'error': 'Dados JSON inválidos ou vazios'}, 400
        
        # Importar o processador de template
        from docjobs_template_processor import DocJobsTemplateProcessor
        
        # Verificar se o template existe
        template_path = os.path.join(DOCJOBS_FOLDER, 'c_alarmes_valida_selecao_arrecadado.docx')
        if not os.path.exists(template_path):
            return {'error': f'Template não encontrado: {template_path}'}, 404
        
        # Criar diretório para arquivos gerados se não existir
        output_dir = os.path.join(DOCJOBS_FOLDER, 'gerados')
        try:
            os.makedirs(output_dir, exist_ok=True)
            print(f'Diretório de saída criado/verificado: {output_dir}')
        except Exception as e:
            print(f'Erro ao criar diretório de saída: {str(e)}')
            return {'error': f'Erro ao criar diretório de saída: {str(e)}'}, 500
        
        # Usar o nome do job para nomear o arquivo
        job_name = data.get('jobName', '').strip()
        if not job_name:
            return {'error': 'Nome do job não fornecido'}, 400
            
        # Gerar nome do arquivo
        filename = f"{job_name}.docx"
        output_path = os.path.join(output_dir, filename)
        print(f'Arquivo será salvo em: {output_path}')
        
        # Criar instância do processador
        processor = DocJobsTemplateProcessor(template_path)
        
        # Validar campos obrigatórios
        missing_fields = processor.validate_required_fields(data)
        if missing_fields:
            field_labels = [field['label'] for field in missing_fields]
            return {'error': f'Campos obrigatórios não preenchidos: {", ".join(field_labels)}', 'missing_fields': missing_fields}, 400
        
        # Processar o template
        success = processor.process_template(data, output_path)
        
        if success:
            # Verificar se o arquivo foi criado
            if os.path.exists(output_path):
                print(f"✅ Documento gerado com sucesso: {output_path}")
                return {'message': 'Documento gerado com sucesso usando template', 'filename': filename}, 201
            else:
                return {'error': 'Falha ao salvar o documento'}, 500
        else:
            return {'error': 'Erro ao processar template'}, 500
            
    except Exception as e:
        print(f"Erro ao gerar documento: {str(e)}")
        return {'error': f'Erro ao gerar documento: {str(e)}'}, 500

@app.route('/api/generate-docjobs-template', methods=['POST'])
def generate_docjobs_template():
    """Gera documento usando o template .doc existente"""
    try:
        data = request.get_json()
        print('Dados recebidos para template:', data)
        if not data:
            return {'error': 'Dados JSON inválidos ou vazios'}, 400
        
        # Verificar campos obrigatórios
        required_fields = [
            'smNumber', 'callNumber', 'requester', 'phone', 'requestDate', 'deadlineDate',
            'subject', 'system', 'businessImpact', 'criticality', 'jobName', 'shellName',
            'path', 'server', 'ip', 'jobDescription', 'frequencyDetails', 'returnCode'
        ]
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return {'error': f'Campos obrigatórios não preenchidos: {", ".join(missing_fields)}'}, 400
        
        # Importar bibliotecas necessárias
        try:
            import pypandoc
            from docxtpl import DocxTemplate
            import tempfile
            import shutil
        except ImportError as e:
            return {'error': f'Biblioteca necessária não instalada: {str(e)}. Execute: pip install pypandoc docxtpl'}, 500
        
        # Caminhos dos arquivos
        doc_template_path = os.path.join(DOCJOBS_FOLDER, 'c_alarmes_valida_selecao_arrecadado.doc')
        output_dir = os.path.join(DOCJOBS_FOLDER, 'gerados')
        
        # Verificar se o template existe
        if not os.path.exists(doc_template_path):
            return {'error': f'Template não encontrado: {doc_template_path}'}, 404
        
        # Criar diretório de saída se não existir
        os.makedirs(output_dir, exist_ok=True)
        
        # Usar o nome do job para nomear o arquivo
        job_name = data.get('jobName', '').strip()
        if not job_name:
            return {'error': 'Nome do job não fornecido'}, 400
        
        # Gerar nome do arquivo final
        final_filename = f"{job_name}_template.docx"
        final_output_path = os.path.join(output_dir, final_filename)
        
        # Criar arquivo temporário para conversão
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_docx_path = os.path.join(temp_dir, 'template_converted.docx')
            
            try:
                # Converter .doc para .docx usando pypandoc
                print(f'Convertendo {doc_template_path} para {temp_docx_path}')
                pypandoc.convert_file(doc_template_path, 'docx', outputfile=temp_docx_path)
                
                # Verificar se a conversão foi bem-sucedida
                if not os.path.exists(temp_docx_path):
                    return {'error': 'Falha na conversão do template .doc para .docx'}, 500
                
                # Carregar o template convertido
                doc = DocxTemplate(temp_docx_path)
                
                # Preparar dados para o template
                # Processar dias da semana
                weekdays = []
                if data.get('monday') == 'on': weekdays.append('Segunda')
                if data.get('tuesday') == 'on': weekdays.append('Terça')
                if data.get('wednesday') == 'on': weekdays.append('Quarta')
                if data.get('thursday') == 'on': weekdays.append('Quinta')
                if data.get('friday') == 'on': weekdays.append('Sexta')
                if data.get('saturday') == 'on': weekdays.append('Sábado')
                if data.get('sunday') == 'on': weekdays.append('Domingo')
                
                # Contexto para o template
                context = {
                    'sm_number': data.get('smNumber', ''),
                    'call_number': data.get('callNumber', ''),
                    'requester': data.get('requester', ''),
                    'phone': data.get('phone', ''),
                    'request_date': data.get('requestDate', ''),
                    'deadline_date': data.get('deadlineDate', ''),
                    'subject': data.get('subject', ''),
                    'system': data.get('system', ''),
                    'business_impact': data.get('businessImpact', ''),
                    'criticality': data.get('criticality', ''),
                    'job_name': data.get('jobName', ''),
                    'shell_name': data.get('shellName', ''),
                    'path': data.get('path', ''),
                    'server': data.get('server', ''),
                    'ip': data.get('ip', ''),
                    'job_description': data.get('jobDescription', ''),
                    'start_time': data.get('startTime', ''),
                    'end_time': data.get('endTime', ''),
                    'weekdays': ', '.join(weekdays),
                    'frequency_details': data.get('frequencyDetails', ''),
                    'predecessor_process': data.get('predecessorProcess', 'N/A'),
                    'successor_process': data.get('successorProcess', 'N/A'),
                    'process_names': data.get('processNames', 'N/A'),
                    'param1': data.get('param1', ''),
                    'param2': data.get('param2', ''),
                    'param3': data.get('param3', ''),
                    'param4': data.get('param4', ''),
                    'param5': data.get('param5', ''),
                    'param6': data.get('param6', ''),
                    'param7': data.get('param7', ''),
                    'param8': data.get('param8', ''),
                    'return_code': data.get('returnCode', ''),
                    'email_notification': data.get('emailNotification', ''),
                    'executor': data.get('executor', ''),
                    'execution_date': data.get('executionDate', ''),
                    'approver': data.get('approver', ''),
                    'approval_date': data.get('approvalDate', '')
                }
                
                # Renderizar o template com os dados
                print('Renderizando template com dados...')
                doc.render(context)
                
                # Salvar o documento final
                doc.save(final_output_path)
                print(f'Documento salvo em: {final_output_path}')
                
                # Verificar se o arquivo foi criado
                if os.path.exists(final_output_path):
                    return {'message': 'Documento gerado com sucesso usando template', 'filename': final_filename}, 201
                else:
                    return {'error': 'Falha ao salvar o documento'}, 500
                    
            except Exception as e:
                print(f'Erro durante o processamento do template: {str(e)}')
                return {'error': f'Erro ao processar template: {str(e)}'}, 500
                
    except Exception as e:
        print(f'Erro geral: {str(e)}')
        return {'error': f'Erro ao gerar documento: {str(e)}'}, 500

@app.route('/docjobs/<filename>')
def download_docjobs(filename):
    """Permite o download de um arquivo DOCJOBS específico"""
    return send_from_directory(os.path.join(DOCJOBS_FOLDER, 'gerados'), filename, as_attachment=True)

if __name__ == '__main__':
    import sys
    # Permite especificar a porta via argumento (ex.: python app.py 5001) ou variável de ambiente FLASK_RUN_PORT.
    default_port = int(os.environ.get('FLASK_RUN_PORT', 5000))
    port = default_port
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Porta inválida. Usando porta padrão {default_port}.")
            port = default_port
    
    debug_env = os.environ.get('FLASK_DEBUG')
    debug_mode = True if debug_env is None else debug_env.lower() not in ('0', 'false')

    print(f"🚀 Iniciando servidor na porta {port}")
    print(f"📋 Acesse: http://127.0.0.1:{port}")

    # Abrir navegador automaticamente (apenas em ambiente local, não em Docker)
    auto_open = os.environ.get('AUTO_OPEN_BROWSER', '').lower() not in ('0', 'false', '')
    if auto_open and (not debug_mode or os.environ.get('WERKZEUG_RUN_MAIN', '').lower() == 'true'):
        threading.Timer(1.0, lambda: webbrowser.open_new(f'http://127.0.0.1:{port}')).start()

    host = app.config['FLASK_HOST']
    app.run(debug=debug_mode, port=port, host=host)