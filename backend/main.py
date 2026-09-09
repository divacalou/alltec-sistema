import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Planna RH & SST API")

# Configuração de CORS para permitir comunicação com o React/Vite
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
DB_PATH = "planna_dados.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- INICIALIZAÇÃO DO BANCO DE DADOS ---
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Tabela de Setores
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS setores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT
    )
    """)

    # Tabela de Colaboradores (incluindo novos campos de demissão)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS colaboradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        matricula TEXT UNIQUE,
        data_nascimento DATE,
        data_admissao DATE NOT NULL,
        cargo TEXT NOT NULL,
        setor_id INTEGER,
        endereco TEXT,
        is_motorista INTEGER DEFAULT 0,
        tipo_veiculo TEXT,
        cnh_numero TEXT,
        cnh_categoria TEXT,
        cnh_validade DATE,
        status TEXT DEFAULT 'Ativo',
        data_demissao DATE,
        motivo_demissao TEXT,
        observacao_demissao TEXT,
        aso_demissional_concluido INTEGER DEFAULT 0,
        exames_demissionais_obs TEXT,
        FOREIGN KEY (setor_id) REFERENCES setores (id)
    )
    """)

    # Migração/Adequação automática de colunas para bancos já existentes
    cursor.execute("PRAGMA table_info(colaboradores)")
    colunas_existentes = [column[1] for column in cursor.fetchall()]

    colunas_novas = [
        ("matricula", "TEXT UNIQUE"),
        ("data_nascimento", "DATE"),
        ("setor_id", "INTEGER"),
        ("endereco", "TEXT"),
        ("is_motorista", "INTEGER DEFAULT 0"),
        ("tipo_veiculo", "TEXT"),
        ("cnh_numero", "TEXT"),
        ("cnh_categoria", "TEXT"),
        ("cnh_validade", "DATE"),
        ("data_demissao", "DATE"),
        ("motivo_demissao", "TEXT"),
        ("observacao_demissao", "TEXT"),
        ("aso_demissional_concluido", "INTEGER DEFAULT 0"),
        ("exames_demissionais_obs", "TEXT")
    ]

    for col_nome, col_tipo in colunas_novas:
        if col_nome not in colunas_existentes:
            try:
                cursor.execute(f"ALTER TABLE colaboradores ADD COLUMN {col_nome} {col_tipo}")
            except Exception as e:
                print(f"Nota ao adicionar coluna {col_nome}: {e}")
    
    # Tabela de Estoque de EPIs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS epis_estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        ca TEXT NOT NULL,
        validade_ca DATE NOT NULL,
        quantidade_estoque INTEGER NOT NULL DEFAULT 0,
        quantidade_minima INTEGER NOT NULL DEFAULT 5,
        descricao TEXT
    )
    """)
    
    # Tabela de Entregas/Saídas de EPIs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS epis_entregas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        colaborador_id INTEGER NOT NULL,
        epi_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        data_entrega DATE NOT NULL,
        data_validade_troca DATE,
        FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id),
        FOREIGN KEY (epi_id) REFERENCES epis_estoque (id)
    )
    """)
    
    # Tabela de PCMSO / Exames (ASO)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pcmso_exames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        colaborador_id INTEGER NOT NULL,
        tipo_exame TEXT NOT NULL,
        data_exame DATE NOT NULL,
        data_proximo_exame DATE NOT NULL,
        resultado TEXT NOT NULL,
        medico_crm TEXT,
        FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id)
    )
    """)
    
    # Tabela de Ocorrências
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ocorrencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        colaborador_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        data_ocorrencia DATE NOT NULL,
        descricao TEXT,
        FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id)
    )
    """)
    
    conn.commit()
    conn.close()

init_db()

# --- SCHEMAS PYDANTIC ---
class SetorCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None

class ColaboradorCreate(BaseModel):
    nome: str
    cpf: str
    matricula: str
    data_nascimento: Optional[str] = None
    data_admissao: str
    cargo: str
    setor_id: Optional[int] = None
    endereco: Optional[str] = None
    is_motorista: Optional[bool] = False
    tipo_veiculo: Optional[str] = None
    cnh_numero: Optional[str] = None
    cnh_categoria: Optional[str] = None
    cnh_validade: Optional[str] = None
    status: Optional[str] = 'Ativo'

class ColaboradorDesligamentoUpdate(BaseModel):
    status: str
    data_demissao: Optional[str] = None
    motivo_demissao: Optional[str] = None
    observacao_demissao: Optional[str] = None
    aso_demissional_concluido: Optional[bool] = False
    exames_demissionais_obs: Optional[str] = None

class EpiCreate(BaseModel):
    nome: str
    ca: str
    validade_ca: str
    quantidade_estoque: int
    quantidade_minima: int = 5
    descricao: Optional[str] = None

class EpiEntregaCreate(BaseModel):
    colaborador_id: int
    epi_id: int
    quantidade: int
    data_entrega: str
    dias_validade_troca: Optional[int] = 180

class AsoCreate(BaseModel):
    colaborador_id: int
    tipo_exame: str
    data_exame: str
    periodicidade_meses: int = 12
    resultado: str
    medico_crm: Optional[str] = None

# --- ROTAS DA API ---

@app.get("/api/kpis")
def get_kpis():
    conn = get_db()
    cursor = conn.cursor()
    
    total_colabs = cursor.execute("SELECT COUNT(*) FROM colaboradores WHERE status = 'Ativo'").fetchone()[0]
    total_epis_baixo = cursor.execute("SELECT COUNT(*) FROM epis_estoque WHERE quantidade_estoque <= quantidade_minima").fetchone()[0]
    
    conn.close()
    return {
        "total_colaboradores": total_colabs,
        "admissoes_mes": 0,
        "afastamentos_mes": 0,
        "ocorrencias_mes": 0,
        "epis_estoque_baixo": total_epis_baixo
    }

# --- ROTAS DE SETORES ---
@app.get("/api/setores")
def listar_setores():
    conn = get_db()
    cursor = conn.cursor()
    setores = cursor.execute("SELECT * FROM setores").fetchall()
    conn.close()
    return [dict(s) for s in setores]

@app.post("/api/setores")
def cadastrar_setor(setor: SetorCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO setores (nome, descricao) VALUES (?, ?)", (setor.nome, setor.descricao))
    conn.commit()
    conn.close()
    return {"message": "Setor cadastrado com sucesso!"}

# --- ROTAS DE COLABORADORES ---
@app.get("/api/colaboradores")
def listar_colaboradores():
    conn = get_db()
    cursor = conn.cursor()
    query = """
        SELECT c.*, s.nome as setor_nome 
        FROM colaboradores c
        LEFT JOIN setores s ON c.setor_id = s.id
    """
    colaboradores = cursor.execute(query).fetchall()
    conn.close()
    return [dict(c) for c in colaboradores]

@app.post("/api/colaboradores")
def cadastrar_colaborador(c: ColaboradorCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO colaboradores 
            (nome, cpf, matricula, data_nascimento, data_admissao, cargo, setor_id, endereco, is_motorista, tipo_veiculo, cnh_numero, cnh_categoria, cnh_validade, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (c.nome, c.cpf, c.matricula, c.data_nascimento, c.data_admissao, c.cargo, c.setor_id, c.endereco, 1 if c.is_motorista else 0, c.tipo_veiculo, c.cnh_numero, c.cnh_categoria, c.cnh_validade, c.status or 'Ativo'))
        conn.commit()
    except sqlite3.IntegrityError as err:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Erro de integridade (CPF ou Matrícula já existente): {err}")
    conn.close()
    return {"message": "Colaborador cadastrado com sucesso!"}

@app.put("/api/colaboradores/{colaborador_id}")
def atualizar_colaborador(colaborador_id: int, c: ColaboradorCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE colaboradores SET
            nome = ?, cpf = ?, matricula = ?, data_nascimento = ?, data_admissao = ?, 
            cargo = ?, setor_id = ?, endereco = ?, is_motorista = ?, tipo_veiculo = ?, 
            cnh_numero = ?, cnh_categoria = ?, cnh_validade = ?, status = ?
        WHERE id = ?
    """, (c.nome, c.cpf, c.matricula, c.data_nascimento, c.data_admissao, c.cargo, c.setor_id, c.endereco, 1 if c.is_motorista else 0, c.tipo_veiculo, c.cnh_numero, c.cnh_categoria, c.cnh_validade, c.status or 'Ativo', colaborador_id))
    conn.commit()
    conn.close()
    return {"message": "Colaborador atualizado com sucesso!"}

@app.patch("/api/colaboradores/{colaborador_id}")
def alterar_status_colaborador(colaborador_id: int, dados: ColaboradorDesligamentoUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE colaboradores SET 
            status = ?,
            data_demissao = ?,
            motivo_demissao = ?,
            observacao_demissao = ?,
            aso_demissional_concluido = ?,
            exames_demissionais_obs = ?
        WHERE id = ?
    """, (
        dados.status,
        dados.data_demissao,
        dados.motivo_demissao,
        dados.observacao_demissao,
        1 if dados.aso_demissional_concluido else 0,
        dados.exames_demissionais_obs,
        colaborador_id
    ))
    conn.commit()
    conn.close()
    return {"message": f"Status do colaborador alterado para {dados.status} com sucesso!"}

# --- ROTAS DE ESTOQUE DE EPIS ---
@app.get("/api/epis")
def listar_epis():
    conn = get_db()
    cursor = conn.cursor()
    epis = cursor.execute("SELECT * FROM epis_estoque").fetchall()
    conn.close()
    return [dict(e) for e in epis]

@app.post("/api/epis")
def cadastrar_epi(epi: EpiCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO epis_estoque (nome, ca, validade_ca, quantidade_estoque, quantidade_minima, descricao)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (epi.nome, epi.ca, epi.validade_ca, epi.quantidade_estoque, epi.quantidade_minima, epi.descricao))
    conn.commit()
    conn.close()
    return {"message": "EPI cadastrado com sucesso!"}

# --- SAÍDA DE EPI COM BAIXA AUTOMÁTICA EM ESTOQUE ---
@app.post("/api/epis/entrega")
def registrar_entrega_epi(entrega: EpiEntregaCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Verificar saldo em estoque
    epi = cursor.execute("SELECT quantidade_estoque FROM epis_estoque WHERE id = ?", (entrega.epi_id,)).fetchone()
    if not epi:
        conn.close()
        raise HTTPException(status_code=404, detail="EPI não encontrado.")
    
    saldo_atual = epi["quantidade_estoque"]
    if saldo_atual < entrega.quantidade:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Estoque insuficiente. Saldo atual: {saldo_atual} un.")
    
    # 2. Calcular data prevista de próxima troca
    data_entrega_dt = datetime.strptime(entrega.data_entrega, "%Y-%m-%d")
    data_troca = (data_entrega_dt + timedelta(days=entrega.dias_validade_troca or 180)).strftime("%Y-%m-%d")
    
    # 3. Registrar a entrega
    cursor.execute("""
        INSERT INTO epis_entregas (colaborador_id, epi_id, quantidade, data_entrega, data_validade_troca)
        VALUES (?, ?, ?, ?, ?)
    """, (entrega.colaborador_id, entrega.epi_id, entrega.quantidade, entrega.data_entrega, data_troca))
    
    # 4. Dar baixa automática no estoque
    cursor.execute("""
        UPDATE epis_estoque
        SET quantidade_estoque = quantidade_estoque - ?
        WHERE id = ?
    """, (entrega.quantidade, entrega.epi_id))
    
    conn.commit()
    conn.close()
    return {"message": "Entrega realizada e baixa executada no estoque com sucesso!"}

# --- ROTAS DO PCMSO / ASO ---
@app.get("/api/pcmso/exames")
def listar_asos():
    try:
        conn = get_db()
        cursor = conn.cursor()
        query = """
            SELECT 
                e.id,
                e.colaborador_id,
                e.tipo_exame,
                e.data_exame,
                e.data_proximo_exame,
                e.resultado,
                e.medico_crm,
                COALESCE(c.nome, 'Não informado') as colaborador_nome,
                COALESCE(c.cargo, 'N/A') as cargo
            FROM pcmso_exames e
            LEFT JOIN colaboradores c ON e.colaborador_id = c.id
        """
        exames = cursor.execute(query).fetchall()
        conn.close()
        return [dict(ex) for ex in exames]
    except Exception as err:
        print(f"Erro ao buscar ASOs: {err}")
        return []

@app.post("/api/pcmso/exames")
def registrar_aso(aso: AsoCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    data_exame_dt = datetime.strptime(aso.data_exame, "%Y-%m-%d")
    proximo_exame = (data_exame_dt + timedelta(days=aso.periodicidade_meses * 30)).strftime("%Y-%m-%d")
    
    cursor.execute("""
        INSERT INTO pcmso_exames (colaborador_id, tipo_exame, data_exame, data_proximo_exame, resultado, medico_crm)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (aso.colaborador_id, aso.tipo_exame, aso.data_exame, proximo_exame, aso.resultado, aso.medico_crm))
    
    conn.commit()
    conn.close()
    return {"message": "ASO registrado com sucesso!"}

# --- CENTRAL DE PENDÊNCIAS DINÂMICA ---
@app.get("/api/pendencias")
def buscar_pendencias():
    conn = get_db()
    cursor = conn.cursor()
    hoje = datetime.now().strftime("%Y-%m-%d")
    limite_30_dias = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    # ASOs a vencer nos próximos 30 dias ou já vencidos
    asos_criticos = cursor.execute("""
        SELECT e.*, c.nome as colaborador_nome, c.setor_id
        FROM pcmso_exames e
        JOIN colaboradores c ON e.colaborador_id = c.id
        WHERE e.data_proximo_exame <= ?
    """, (limite_30_dias,)).fetchall()
    
    # EPIs com estoque abaixo do mínimo
    epis_criticos = cursor.execute("""
        SELECT * FROM epis_estoque WHERE quantidade_estoque <= quantidade_minima
    """).fetchall()
    
    conn.close()
    return {
        "asos_criticos": [dict(a) for a in asos_criticos],
        "epis_estoque_baixo": [dict(e) for e in epis_criticos]
    }