# -*- coding: utf-8 -*-
"""
Planna RH & SST - API Backend (FastAPI + SQLite)
Fonte única de verdade para todas as telas do sistema.

Unifica o schema anteriormente dividido entre main.py e database.py,
adiciona os endpoints que o frontend já consumia mas que não existiam
(/api/colaboradores/setores, /api/colaboradores/{id}/permissao,
/api/configuracoes) e valida CPF/dados obrigatórios no servidor,
não apenas no frontend.
"""
import re
import sqlite3
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Planna RH & SST API", version="2.0.0")

# --- CONFIGURAÇÃO DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "planna_dados.db"


# ----------------------------------------------------------------------
# Conexão e utilidades de banco
# ----------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def linhas(cursor_result):
    return [dict(r) for r in cursor_result]


def hoje_iso():
    return datetime.now().strftime("%Y-%m-%d")


def mes_atual():
    return datetime.now().strftime("%Y-%m")


def somar_dias_iso(data_iso: str, dias: int) -> str:
    dt = datetime.strptime(data_iso, "%Y-%m-%d")
    return (dt + timedelta(days=dias)).strftime("%Y-%m-%d")


def somar_meses_iso(data_iso: str, meses: int) -> str:
    dt = datetime.strptime(data_iso, "%Y-%m-%d")
    mes_total = dt.month - 1 + meses
    ano = dt.year + mes_total // 12
    mes = mes_total % 12 + 1
    dias_no_mes = [
        31,
        29 if ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0) else 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ]
    dia = min(dt.day, dias_no_mes[mes - 1])
    return datetime(ano, mes, dia).strftime("%Y-%m-%d")


def normalizar_cpf(cpf: Optional[str]) -> Optional[str]:
    if not cpf:
        return None
    limpo = re.sub(r"\D", "", cpf)
    return limpo or None


def cpf_valido(cpf: Optional[str]) -> bool:
    """Valida os dígitos verificadores do CPF (mesmo algoritmo usado no frontend)."""
    cpf = re.sub(r"\D", "", cpf or "")
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    digito1 = 0 if resto in (10, 11) else resto
    if digito1 != int(cpf[9]):
        return False

    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    digito2 = 0 if resto in (10, 11) else resto
    if digito2 != int(cpf[10]):
        return False

    return True


# ----------------------------------------------------------------------
# Inicialização / migração do banco
# ----------------------------------------------------------------------
def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS setores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT
        );

        CREATE TABLE IF NOT EXISTS colaboradores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            matricula TEXT UNIQUE,
            data_nascimento TEXT,
            data_admissao TEXT NOT NULL,
            cargo TEXT NOT NULL,
            funcao_opcional TEXT,
            observacoes_contrato TEXT,
            data_afastamento TEXT,
            setor_id INTEGER,
            endereco TEXT,
            is_motorista INTEGER DEFAULT 0,
            tipo_veiculo TEXT,
            cnh_numero TEXT,
            cnh_categoria TEXT,
            cnh_validade TEXT,
            perfil_acesso TEXT DEFAULT 'Técnico SST',
            status TEXT DEFAULT 'Ativo',
            data_demissao TEXT,
            motivo_demissao TEXT,
            observacao_demissao TEXT,
            aso_demissional_concluido INTEGER DEFAULT 0,
            exames_demissionais_obs TEXT,
            criado_em TEXT,
            FOREIGN KEY (setor_id) REFERENCES setores (id)
        );

        CREATE TABLE IF NOT EXISTS epis_estoque (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ca TEXT NOT NULL,
            validade_ca TEXT NOT NULL,
            quantidade_estoque INTEGER NOT NULL DEFAULT 0,
            quantidade_minima INTEGER NOT NULL DEFAULT 5,
            descricao TEXT
        );

        CREATE TABLE IF NOT EXISTS epis_entregas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            colaborador_id INTEGER NOT NULL,
            epi_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            data_entrega TEXT NOT NULL,
            data_validade_troca TEXT,
            motivo_troca TEXT,
            FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id),
            FOREIGN KEY (epi_id) REFERENCES epis_estoque (id)
        );

        CREATE TABLE IF NOT EXISTS pcmso_exames (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            colaborador_id INTEGER NOT NULL,
            tipo_exame TEXT NOT NULL,
            data_exame TEXT NOT NULL,
            periodicidade_meses INTEGER DEFAULT 12,
            data_proximo_exame TEXT NOT NULL,
            resultado TEXT NOT NULL,
            medico_crm TEXT,
            observacoes TEXT,
            funcao_pgr_id INTEGER,
            tem_insalubridade INTEGER DEFAULT 0,
            grau_insalubridade TEXT,
            tem_periculosidade INTEGER DEFAULT 0,
            percentual_periculosidade REAL,
            FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id),
            FOREIGN KEY (funcao_pgr_id) REFERENCES pgr_funcoes (id)
        );

        CREATE TABLE IF NOT EXISTS pcmso_aso_exames (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aso_id INTEGER NOT NULL,
            nome_exame TEXT NOT NULL,
            periodicidade_meses INTEGER,
            FOREIGN KEY (aso_id) REFERENCES pcmso_exames (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS pgr_funcoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_funcao TEXT NOT NULL UNIQUE,
            riscos_identificados TEXT,
            tem_insalubridade INTEGER DEFAULT 0,
            grau_insalubridade TEXT,
            tem_periculosidade INTEGER DEFAULT 0,
            percentual_periculosidade REAL,
            observacoes TEXT
        );

        CREATE TABLE IF NOT EXISTS pgr_exames_funcao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcao_id INTEGER NOT NULL,
            nome_exame TEXT NOT NULL,
            periodicidade_meses INTEGER NOT NULL DEFAULT 12,
            obrigatorio_admissional INTEGER DEFAULT 1,
            obrigatorio_periodico INTEGER DEFAULT 1,
            obrigatorio_demissional INTEGER DEFAULT 1,
            obrigatorio_retorno_trabalho INTEGER DEFAULT 0,
            obrigatorio_mudanca_risco INTEGER DEFAULT 1,
            FOREIGN KEY (funcao_id) REFERENCES pgr_funcoes (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            colaborador_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            data_ocorrencia TEXT NOT NULL,
            gravidade TEXT DEFAULT 'Baixa',
            status TEXT DEFAULT 'Pendente',
            descricao TEXT,
            FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id)
        );

        CREATE TABLE IF NOT EXISTS configuracoes (
            chave TEXT PRIMARY KEY,
            valor TEXT
        );
        """
    )

    # --- Migração incremental para bancos já existentes (não apaga dados) ---
    def garantir_coluna(tabela, coluna, tipo_sql):
        cur.execute(f"PRAGMA table_info({tabela})")
        existentes = [c[1] for c in cur.fetchall()]
        if coluna not in existentes:
            cur.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {tipo_sql}")

    for coluna, tipo in [
        ("matricula", "TEXT"),
        ("funcao_opcional", "TEXT"),
        ("observacoes_contrato", "TEXT"),
        ("data_afastamento", "TEXT"),
        ("perfil_acesso", "TEXT DEFAULT 'Técnico SST'"),
        ("criado_em", "TEXT"),
    ]:
        garantir_coluna("colaboradores", coluna, tipo)

    garantir_coluna("epis_entregas", "motivo_troca", "TEXT")
    garantir_coluna("ocorrencias", "gravidade", "TEXT DEFAULT 'Baixa'")
    garantir_coluna("ocorrencias", "status", "TEXT DEFAULT 'Pendente'")
    garantir_coluna("pcmso_exames", "funcao_pgr_id", "INTEGER")
    garantir_coluna("pcmso_exames", "tem_insalubridade", "INTEGER DEFAULT 0")
    garantir_coluna("pcmso_exames", "grau_insalubridade", "TEXT")
    garantir_coluna("pcmso_exames", "tem_periculosidade", "INTEGER DEFAULT 0")
    garantir_coluna("pcmso_exames", "percentual_periculosidade", "REAL")

    # Parâmetros padrão de alerta (só cria se ainda não existirem)
    cur.execute("INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('dias_alerta_aso', '30')")
    cur.execute("INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('dias_alerta_epi', '15')")

    conn.commit()
    conn.close()


init_db()


# ----------------------------------------------------------------------
# Schemas Pydantic
# ----------------------------------------------------------------------
class SetorCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None


class ColaboradorCreate(BaseModel):
    nome: str
    cpf: str
    matricula: Optional[str] = None
    data_nascimento: Optional[str] = None
    data_admissao: str
    cargo: str
    funcao_opcional: Optional[str] = None
    observacoes_contrato: Optional[str] = None
    data_afastamento: Optional[str] = None
    setor_id: Optional[int] = None
    endereco: Optional[str] = None
    is_motorista: Optional[bool] = False
    tipo_veiculo: Optional[str] = None
    cnh_numero: Optional[str] = None
    cnh_categoria: Optional[str] = None
    cnh_validade: Optional[str] = None
    status: Optional[str] = "Ativo"


class ColaboradorDesligamentoUpdate(BaseModel):
    status: str
    data_demissao: Optional[str] = None
    motivo_demissao: Optional[str] = None
    observacao_demissao: Optional[str] = None
    aso_demissional_concluido: Optional[bool] = False
    exames_demissionais_obs: Optional[str] = None


class PermissaoUpdate(BaseModel):
    perfil_acesso: str


class EpiCreate(BaseModel):
    nome: str
    ca: str
    validade_ca: str
    quantidade_estoque: int = 0
    quantidade_minima: int = 5
    descricao: Optional[str] = None


class EpiUpdate(BaseModel):
    nome: Optional[str] = None
    ca: Optional[str] = None
    validade_ca: Optional[str] = None
    quantidade_estoque: Optional[int] = None
    quantidade_minima: Optional[int] = None
    descricao: Optional[str] = None


class EpiEntregaCreate(BaseModel):
    colaborador_id: int
    epi_id: int
    quantidade: int
    data_entrega: str
    motivo_troca: Optional[str] = "ENTREGA"
    dias_validade_troca: Optional[int] = 180


class ExameComplementarInput(BaseModel):
    nome_exame: str
    periodicidade_meses: Optional[int] = None


class AsoCreate(BaseModel):
    colaborador_id: int
    tipo_exame: str  # Admissional | Periódico | Demissional | Retorno ao Trabalho | Mudança de Risco
    data_exame: str
    resultado: str
    medico_crm: Optional[str] = None
    observacoes: Optional[str] = None
    funcao_pgr_id: Optional[int] = None
    tem_insalubridade: Optional[bool] = False
    grau_insalubridade: Optional[str] = None
    tem_periculosidade: Optional[bool] = False
    percentual_periculosidade: Optional[float] = None
    exames_realizados: Optional[List[ExameComplementarInput]] = []


class PgrFuncaoCreate(BaseModel):
    nome_funcao: str
    riscos_identificados: Optional[str] = None
    tem_insalubridade: Optional[bool] = False
    grau_insalubridade: Optional[str] = None
    tem_periculosidade: Optional[bool] = False
    percentual_periculosidade: Optional[float] = None
    observacoes: Optional[str] = None


class PgrExameCreate(BaseModel):
    nome_exame: str
    periodicidade_meses: int = 12
    obrigatorio_admissional: Optional[bool] = True
    obrigatorio_periodico: Optional[bool] = True
    obrigatorio_demissional: Optional[bool] = True
    obrigatorio_retorno_trabalho: Optional[bool] = False
    obrigatorio_mudanca_risco: Optional[bool] = True


class OcorrenciaCreate(BaseModel):
    colaborador_id: int
    tipo: str
    data: str
    gravidade: Optional[str] = "Baixa"
    descricao: Optional[str] = None


class OcorrenciaStatusUpdate(BaseModel):
    status: str


class ConfiguracaoUpdate(BaseModel):
    dias_alerta_aso: Optional[int] = None
    dias_alerta_epi: Optional[int] = None


# ----------------------------------------------------------------------
# Rota raiz
# ----------------------------------------------------------------------
@app.get("/")
@app.get("/api")
def read_root():
    return {"status": "API Planna rodando com sucesso", "versao": "2.0.0"}


# ----------------------------------------------------------------------
# KPIs do Dashboard
# ----------------------------------------------------------------------
@app.get("/api/kpis")
def get_kpis():
    conn = get_db()
    cur = conn.cursor()
    mes = mes_atual()

    total_colaboradores = cur.execute(
        "SELECT COUNT(*) FROM colaboradores WHERE status = 'Ativo'"
    ).fetchone()[0]

    admissoes_mes = cur.execute(
        "SELECT COUNT(*) FROM colaboradores WHERE substr(data_admissao, 1, 7) = ?",
        (mes,),
    ).fetchone()[0]

    afastamentos_mes = cur.execute(
        "SELECT COUNT(*) FROM colaboradores WHERE status = 'Inativo' AND substr(data_demissao, 1, 7) = ?",
        (mes,),
    ).fetchone()[0]

    ocorrencias_mes = cur.execute(
        "SELECT COUNT(*) FROM ocorrencias WHERE substr(data_ocorrencia, 1, 7) = ?",
        (mes,),
    ).fetchone()[0]

    epis_estoque_baixo = cur.execute(
        "SELECT COUNT(*) FROM epis_estoque WHERE quantidade_estoque <= quantidade_minima"
    ).fetchone()[0]

    conn.close()
    return {
        "total_colaboradores": total_colaboradores,
        "admissoes_mes": admissoes_mes,
        "afastamentos_mes": afastamentos_mes,
        "ocorrencias_mes": ocorrencias_mes,
        "epis_estoque_baixo": epis_estoque_baixo,
    }


# ----------------------------------------------------------------------
# Setores
# ----------------------------------------------------------------------
@app.get("/api/setores")
def listar_setores():
    conn = get_db()
    dados = linhas(conn.execute("SELECT * FROM setores ORDER BY nome").fetchall())
    conn.close()
    return dados


@app.post("/api/setores")
def cadastrar_setor(setor: SetorCreate):
    nome = (setor.nome or "").strip()
    if not nome:
        raise HTTPException(status_code=400, detail="O nome do setor é obrigatório.")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO setores (nome, descricao) VALUES (?, ?)", (nome, setor.descricao))
    conn.commit()
    novo_id = cur.lastrowid
    setor_criado = dict(cur.execute("SELECT * FROM setores WHERE id = ?", (novo_id,)).fetchone())
    conn.close()
    return setor_criado


@app.get("/api/colaboradores/setores")
def colaboradores_por_setor():
    """Agregação usada no gráfico de rosca do Dashboard (colaboradores ativos por setor)."""
    conn = get_db()
    query = """
        SELECT s.nome AS setor, COUNT(c.id) AS quantidade
        FROM setores s
        LEFT JOIN colaboradores c ON c.setor_id = s.id AND c.status = 'Ativo'
        GROUP BY s.id
        HAVING quantidade > 0
        ORDER BY quantidade DESC
    """
    dados = linhas(conn.execute(query).fetchall())
    conn.close()
    return dados


# ----------------------------------------------------------------------
# Colaboradores
# ----------------------------------------------------------------------
def _validar_dados_colaborador(c: ColaboradorCreate):
    if not (c.nome or "").strip():
        raise HTTPException(status_code=400, detail="O nome do colaborador é obrigatório.")
    if not (c.cargo or "").strip():
        raise HTTPException(status_code=400, detail="A função/cargo é obrigatória.")
    if not c.data_admissao:
        raise HTTPException(status_code=400, detail="A data de admissão é obrigatória.")
    if not cpf_valido(c.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido. Verifique os números digitados.")
    if c.is_motorista:
        cnh_digitos = re.sub(r"\D", "", c.cnh_numero or "")
        if c.cnh_numero and len(cnh_digitos) != 11:
            raise HTTPException(status_code=400, detail="O número da CNH deve ter exatamente 11 dígitos.")
        if not c.cnh_validade:
            raise HTTPException(status_code=400, detail="Informe a validade da CNH para motoristas.")


def _tratar_erro_integridade_colaborador(err: sqlite3.IntegrityError):
    msg = str(err).lower()
    if "cpf" in msg:
        raise HTTPException(status_code=400, detail="Já existe um colaborador cadastrado com este CPF.")
    if "matricula" in msg:
        raise HTTPException(status_code=400, detail="Já existe um colaborador cadastrado com esta matrícula.")
    raise HTTPException(status_code=400, detail="Não foi possível salvar: verifique dados duplicados ou inválidos.")


@app.get("/api/colaboradores")
def listar_colaboradores():
    conn = get_db()
    query = """
        SELECT c.*, s.nome AS setor_nome
        FROM colaboradores c
        LEFT JOIN setores s ON c.setor_id = s.id
        ORDER BY c.nome
    """
    dados = linhas(conn.execute(query).fetchall())
    conn.close()
    return dados


@app.post("/api/colaboradores")
def cadastrar_colaborador(c: ColaboradorCreate):
    _validar_dados_colaborador(c)
    cpf_limpo = normalizar_cpf(c.cpf)

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO colaboradores
            (nome, cpf, matricula, data_nascimento, data_admissao, cargo, funcao_opcional,
             observacoes_contrato, data_afastamento, setor_id, endereco, is_motorista,
             tipo_veiculo, cnh_numero, cnh_categoria, cnh_validade, status, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                c.nome.strip(), cpf_limpo, c.matricula or None, c.data_nascimento or None,
                c.data_admissao, c.cargo.strip(), c.funcao_opcional or None,
                c.observacoes_contrato or None, c.data_afastamento or None, c.setor_id,
                c.endereco or None, 1 if c.is_motorista else 0,
                c.tipo_veiculo if c.is_motorista else None,
                c.cnh_numero if c.is_motorista else None,
                c.cnh_categoria if c.is_motorista else None,
                c.cnh_validade if c.is_motorista else None,
                c.status or "Ativo", hoje_iso(),
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError as err:
        conn.rollback()
        conn.close()
        _tratar_erro_integridade_colaborador(err)
        return

    conn.close()
    return {"message": "Colaborador cadastrado com sucesso!"}


@app.put("/api/colaboradores/{colaborador_id}")
def atualizar_colaborador(colaborador_id: int, c: ColaboradorCreate):
    _validar_dados_colaborador(c)
    cpf_limpo = normalizar_cpf(c.cpf)

    conn = get_db()
    cur = conn.cursor()

    existente = cur.execute("SELECT id FROM colaboradores WHERE id = ?", (colaborador_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

    try:
        cur.execute(
            """
            UPDATE colaboradores SET
                nome = ?, cpf = ?, matricula = ?, data_nascimento = ?, data_admissao = ?,
                cargo = ?, funcao_opcional = ?, observacoes_contrato = ?, data_afastamento = ?,
                setor_id = ?, endereco = ?, is_motorista = ?, tipo_veiculo = ?,
                cnh_numero = ?, cnh_categoria = ?, cnh_validade = ?, status = ?
            WHERE id = ?
            """,
            (
                c.nome.strip(), cpf_limpo, c.matricula or None, c.data_nascimento or None,
                c.data_admissao, c.cargo.strip(), c.funcao_opcional or None,
                c.observacoes_contrato or None, c.data_afastamento or None, c.setor_id,
                c.endereco or None, 1 if c.is_motorista else 0,
                c.tipo_veiculo if c.is_motorista else None,
                c.cnh_numero if c.is_motorista else None,
                c.cnh_categoria if c.is_motorista else None,
                c.cnh_validade if c.is_motorista else None,
                c.status or "Ativo", colaborador_id,
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError as err:
        conn.rollback()
        conn.close()
        _tratar_erro_integridade_colaborador(err)
        return

    conn.close()
    return {"message": "Colaborador atualizado com sucesso!"}


@app.patch("/api/colaboradores/{colaborador_id}")
def alterar_status_colaborador(colaborador_id: int, dados: ColaboradorDesligamentoUpdate):
    conn = get_db()
    cur = conn.cursor()

    existente = cur.execute("SELECT id FROM colaboradores WHERE id = ?", (colaborador_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

    cur.execute(
        """
        UPDATE colaboradores SET
            status = ?, data_demissao = ?, motivo_demissao = ?,
            observacao_demissao = ?, aso_demissional_concluido = ?, exames_demissionais_obs = ?
        WHERE id = ?
        """,
        (
            dados.status,
            dados.data_demissao,
            dados.motivo_demissao,
            dados.observacao_demissao,
            1 if dados.aso_demissional_concluido else 0,
            dados.exames_demissionais_obs,
            colaborador_id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": f"Status do colaborador alterado para {dados.status} com sucesso!"}


@app.patch("/api/colaboradores/{colaborador_id}/permissao")
def alterar_permissao_colaborador(colaborador_id: int, dados: PermissaoUpdate):
    conn = get_db()
    cur = conn.cursor()

    existente = cur.execute("SELECT id FROM colaboradores WHERE id = ?", (colaborador_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

    cur.execute("UPDATE colaboradores SET perfil_acesso = ? WHERE id = ?", (dados.perfil_acesso, colaborador_id))
    conn.commit()
    conn.close()
    return {"message": "Nível de acesso atualizado com sucesso!"}


# ----------------------------------------------------------------------
# EPIs - Estoque
# ----------------------------------------------------------------------
@app.get("/api/epis")
def listar_epis():
    conn = get_db()
    dados = linhas(conn.execute("SELECT * FROM epis_estoque ORDER BY nome").fetchall())
    conn.close()
    return dados


@app.post("/api/epis")
def cadastrar_epi(epi: EpiCreate):
    if not (epi.nome or "").strip():
        raise HTTPException(status_code=400, detail="O nome do EPI é obrigatório.")
    if not (epi.ca or "").strip():
        raise HTTPException(status_code=400, detail="O número do C.A. é obrigatório.")
    if epi.quantidade_estoque < 0 or epi.quantidade_minima < 0:
        raise HTTPException(status_code=400, detail="As quantidades não podem ser negativas.")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO epis_estoque (nome, ca, validade_ca, quantidade_estoque, quantidade_minima, descricao)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (epi.nome.strip(), epi.ca.strip(), epi.validade_ca, epi.quantidade_estoque, epi.quantidade_minima, epi.descricao),
    )
    conn.commit()
    conn.close()
    return {"message": "EPI cadastrado com sucesso!"}


@app.put("/api/epis/{epi_id}")
@app.patch("/api/epis/{epi_id}")
def atualizar_epi(epi_id: int, epi: EpiUpdate):
    conn = get_db()
    cur = conn.cursor()

    atual = cur.execute("SELECT id FROM epis_estoque WHERE id = ?", (epi_id,)).fetchone()
    if not atual:
        conn.close()
        raise HTTPException(status_code=404, detail="EPI não encontrado.")

    dados = epi.model_dump(exclude_unset=True, exclude_none=True)
    if not dados:
        conn.close()
        return {"message": "Nenhuma alteração enviada."}

    if "quantidade_estoque" in dados and dados["quantidade_estoque"] < 0:
        conn.close()
        raise HTTPException(status_code=400, detail="O saldo de estoque não pode ser negativo.")
    if "quantidade_minima" in dados and dados["quantidade_minima"] < 0:
        conn.close()
        raise HTTPException(status_code=400, detail="A quantidade mínima não pode ser negativa.")

    campos = ", ".join(f"{k} = ?" for k in dados.keys())
    valores = list(dados.values()) + [epi_id]
    cur.execute(f"UPDATE epis_estoque SET {campos} WHERE id = ?", valores)
    conn.commit()
    conn.close()
    return {"message": "EPI atualizado com sucesso!"}


# ----------------------------------------------------------------------
# EPIs - Entregas (com baixa automática em estoque)
# ----------------------------------------------------------------------
@app.get("/api/epis/entrega")
def listar_entregas():
    conn = get_db()
    query = """
        SELECT en.*, c.nome AS colaborador_nome, c.cargo AS colaborador_cargo,
               ep.nome AS epi_nome, ep.ca AS ca
        FROM epis_entregas en
        JOIN colaboradores c ON c.id = en.colaborador_id
        JOIN epis_estoque ep ON ep.id = en.epi_id
        ORDER BY en.data_entrega DESC, en.id DESC
    """
    dados = linhas(conn.execute(query).fetchall())
    conn.close()
    return dados


@app.post("/api/epis/entrega")
def registrar_entrega_epi(entrega: EpiEntregaCreate):
    if entrega.quantidade <= 0:
        raise HTTPException(status_code=400, detail="A quantidade entregue deve ser maior que zero.")

    conn = get_db()
    cur = conn.cursor()

    epi = cur.execute("SELECT quantidade_estoque FROM epis_estoque WHERE id = ?", (entrega.epi_id,)).fetchone()
    if not epi:
        conn.close()
        raise HTTPException(status_code=404, detail="EPI não encontrado.")

    colaborador = cur.execute("SELECT id FROM colaboradores WHERE id = ?", (entrega.colaborador_id,)).fetchone()
    if not colaborador:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

    saldo_atual = epi["quantidade_estoque"]
    if saldo_atual < entrega.quantidade:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Estoque insuficiente. Saldo atual: {saldo_atual} un.")

    try:
        data_troca = somar_dias_iso(entrega.data_entrega, entrega.dias_validade_troca or 180)
    except ValueError:
        conn.close()
        raise HTTPException(status_code=400, detail="Data de entrega inválida. Utilize o formato AAAA-MM-DD.")

    cur.execute(
        """
        INSERT INTO epis_entregas (colaborador_id, epi_id, quantidade, data_entrega, data_validade_troca, motivo_troca)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (entrega.colaborador_id, entrega.epi_id, entrega.quantidade, entrega.data_entrega, data_troca, entrega.motivo_troca),
    )
    cur.execute(
        "UPDATE epis_estoque SET quantidade_estoque = quantidade_estoque - ? WHERE id = ?",
        (entrega.quantidade, entrega.epi_id),
    )
    conn.commit()
    conn.close()
    return {"message": "Entrega realizada e baixa executada no estoque com sucesso!"}


# ----------------------------------------------------------------------
# PCMSO / Exames (ASO)
# ----------------------------------------------------------------------
@app.get("/api/pcmso/exames")
def listar_asos():
    conn = get_db()
    query = """
        SELECT e.*, COALESCE(c.nome, 'Não informado') AS colaborador_nome,
               COALESCE(c.cargo, 'N/A') AS cargo
        FROM pcmso_exames e
        LEFT JOIN colaboradores c ON e.colaborador_id = c.id
        ORDER BY e.data_proximo_exame
    """
    asos = linhas(conn.execute(query).fetchall())

    if asos:
        aso_ids = [a["id"] for a in asos]
        placeholders = ",".join("?" * len(aso_ids))
        complementares = linhas(
            conn.execute(
                f"SELECT * FROM pcmso_aso_exames WHERE aso_id IN ({placeholders})",
                aso_ids,
            ).fetchall()
        )
        mapa_complementares = {}
        for item in complementares:
            mapa_complementares.setdefault(item["aso_id"], []).append(item)
        for aso in asos:
            aso["exames_realizados"] = mapa_complementares.get(aso["id"], [])

    conn.close()
    return asos


@app.post("/api/pcmso/exames")
def registrar_aso(aso: AsoCreate):
    conn = get_db()
    cur = conn.cursor()

    colaborador = cur.execute("SELECT id FROM colaboradores WHERE id = ?", (aso.colaborador_id,)).fetchone()
    if not colaborador:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

    if not (aso.tipo_exame or "").strip():
        conn.close()
        raise HTTPException(status_code=400, detail="O tipo de ASO é obrigatório.")
    if not (aso.resultado or "").strip():
        conn.close()
        raise HTTPException(status_code=400, detail="O resultado do exame é obrigatório.")

    # A data do próximo ASO é puxada pela MENOR periodicidade entre os exames
    # complementares exigidos nesta bateria (ex.: audiometria a cada 12 meses
    # antecipa o próximo ASO completo mesmo que outro exame vença em 24 meses).
    periodicidades = [
        item.periodicidade_meses for item in (aso.exames_realizados or []) if item.periodicidade_meses
    ]
    periodicidade_base = min(periodicidades) if periodicidades else 12

    try:
        proximo_exame = somar_meses_iso(aso.data_exame, periodicidade_base)
    except ValueError:
        conn.close()
        raise HTTPException(status_code=400, detail="Data do exame inválida. Utilize o formato AAAA-MM-DD.")

    cur.execute(
        """
        INSERT INTO pcmso_exames
        (colaborador_id, tipo_exame, data_exame, periodicidade_meses, data_proximo_exame, resultado,
         medico_crm, observacoes, funcao_pgr_id, tem_insalubridade, grau_insalubridade,
         tem_periculosidade, percentual_periculosidade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            aso.colaborador_id, aso.tipo_exame, aso.data_exame, periodicidade_base,
            proximo_exame, aso.resultado, aso.medico_crm, aso.observacoes, aso.funcao_pgr_id,
            1 if aso.tem_insalubridade else 0, aso.grau_insalubridade,
            1 if aso.tem_periculosidade else 0, aso.percentual_periculosidade,
        ),
    )
    aso_id = cur.lastrowid

    for item in (aso.exames_realizados or []):
        cur.execute(
            "INSERT INTO pcmso_aso_exames (aso_id, nome_exame, periodicidade_meses) VALUES (?, ?, ?)",
            (aso_id, item.nome_exame, item.periodicidade_meses),
        )

    conn.commit()
    conn.close()
    return {"message": "ASO registrado com sucesso!", "data_proximo_exame": proximo_exame}


# ----------------------------------------------------------------------
# PGR / Matriz de Risco por Função — base da automação do PCMSO
# ----------------------------------------------------------------------
@app.get("/api/pgr/funcoes")
def listar_funcoes_pgr():
    conn = get_db()
    funcoes = linhas(conn.execute("SELECT * FROM pgr_funcoes ORDER BY nome_funcao").fetchall())

    if funcoes:
        funcao_ids = [f["id"] for f in funcoes]
        placeholders = ",".join("?" * len(funcao_ids))
        exames = linhas(
            conn.execute(
                f"SELECT * FROM pgr_exames_funcao WHERE funcao_id IN ({placeholders}) ORDER BY nome_exame",
                funcao_ids,
            ).fetchall()
        )
        mapa_exames = {}
        for exame in exames:
            mapa_exames.setdefault(exame["funcao_id"], []).append(exame)
        for funcao in funcoes:
            funcao["exames"] = mapa_exames.get(funcao["id"], [])

    conn.close()
    return funcoes


@app.get("/api/pgr/funcoes/mapa")
def buscar_funcao_pgr_por_cargo(cargo: str):
    """Usado pelo modal 'Lançar ASO' para carregar automaticamente a matriz da função
    a partir do cargo do colaborador selecionado. Retorna null se a função ainda
    não estiver cadastrada na matriz (o modal cai no fluxo manual nesse caso)."""
    conn = get_db()
    funcao = conn.execute(
        "SELECT * FROM pgr_funcoes WHERE lower(nome_funcao) = lower(?)", (cargo.strip(),)
    ).fetchone()

    if not funcao:
        conn.close()
        return None

    funcao_dict = dict(funcao)
    funcao_dict["exames"] = linhas(
        conn.execute(
            "SELECT * FROM pgr_exames_funcao WHERE funcao_id = ? ORDER BY nome_exame",
            (funcao_dict["id"],),
        ).fetchall()
    )
    conn.close()
    return funcao_dict


@app.post("/api/pgr/funcoes")
def cadastrar_funcao_pgr(funcao: PgrFuncaoCreate):
    nome = (funcao.nome_funcao or "").strip()
    if not nome:
        raise HTTPException(status_code=400, detail="O nome da função é obrigatório.")

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO pgr_funcoes
            (nome_funcao, riscos_identificados, tem_insalubridade, grau_insalubridade,
             tem_periculosidade, percentual_periculosidade, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                nome, funcao.riscos_identificados, 1 if funcao.tem_insalubridade else 0,
                funcao.grau_insalubridade, 1 if funcao.tem_periculosidade else 0,
                funcao.percentual_periculosidade, funcao.observacoes,
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="Já existe uma função cadastrada com este nome no PGR.")

    novo_id = cur.lastrowid
    conn.close()
    return {"id": novo_id, "message": "Função cadastrada na matriz PGR com sucesso!"}


@app.put("/api/pgr/funcoes/{funcao_id}")
def atualizar_funcao_pgr(funcao_id: int, funcao: PgrFuncaoCreate):
    nome = (funcao.nome_funcao or "").strip()
    if not nome:
        raise HTTPException(status_code=400, detail="O nome da função é obrigatório.")

    conn = get_db()
    cur = conn.cursor()

    existente = cur.execute("SELECT id FROM pgr_funcoes WHERE id = ?", (funcao_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Função não encontrada na matriz PGR.")

    try:
        cur.execute(
            """
            UPDATE pgr_funcoes SET
                nome_funcao = ?, riscos_identificados = ?, tem_insalubridade = ?,
                grau_insalubridade = ?, tem_periculosidade = ?, percentual_periculosidade = ?,
                observacoes = ?
            WHERE id = ?
            """,
            (
                nome, funcao.riscos_identificados, 1 if funcao.tem_insalubridade else 0,
                funcao.grau_insalubridade, 1 if funcao.tem_periculosidade else 0,
                funcao.percentual_periculosidade, funcao.observacoes, funcao_id,
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="Já existe uma função cadastrada com este nome no PGR.")

    conn.close()
    return {"message": "Função da matriz PGR atualizada com sucesso!"}


@app.delete("/api/pgr/funcoes/{funcao_id}")
def excluir_funcao_pgr(funcao_id: int):
    conn = get_db()
    cur = conn.cursor()
    existente = cur.execute("SELECT id FROM pgr_funcoes WHERE id = ?", (funcao_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Função não encontrada na matriz PGR.")

    cur.execute("DELETE FROM pgr_funcoes WHERE id = ?", (funcao_id,))
    conn.commit()
    conn.close()
    return {"message": "Função removida da matriz PGR com sucesso!"}


@app.post("/api/pgr/funcoes/{funcao_id}/exames")
def adicionar_exame_pgr(funcao_id: int, exame: PgrExameCreate):
    if not (exame.nome_exame or "").strip():
        raise HTTPException(status_code=400, detail="O nome do exame é obrigatório.")

    conn = get_db()
    cur = conn.cursor()
    funcao = cur.execute("SELECT id FROM pgr_funcoes WHERE id = ?", (funcao_id,)).fetchone()
    if not funcao:
        conn.close()
        raise HTTPException(status_code=404, detail="Função não encontrada na matriz PGR.")

    cur.execute(
        """
        INSERT INTO pgr_exames_funcao
        (funcao_id, nome_exame, periodicidade_meses, obrigatorio_admissional, obrigatorio_periodico,
         obrigatorio_demissional, obrigatorio_retorno_trabalho, obrigatorio_mudanca_risco)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            funcao_id, exame.nome_exame.strip(), exame.periodicidade_meses,
            1 if exame.obrigatorio_admissional else 0, 1 if exame.obrigatorio_periodico else 0,
            1 if exame.obrigatorio_demissional else 0, 1 if exame.obrigatorio_retorno_trabalho else 0,
            1 if exame.obrigatorio_mudanca_risco else 0,
        ),
    )
    conn.commit()
    novo_id = cur.lastrowid
    conn.close()
    return {"id": novo_id, "message": "Exame adicionado à função com sucesso!"}


@app.put("/api/pgr/exames/{exame_id}")
def atualizar_exame_pgr(exame_id: int, exame: PgrExameCreate):
    conn = get_db()
    cur = conn.cursor()
    existente = cur.execute("SELECT id FROM pgr_exames_funcao WHERE id = ?", (exame_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Exame não encontrado na matriz PGR.")

    cur.execute(
        """
        UPDATE pgr_exames_funcao SET
            nome_exame = ?, periodicidade_meses = ?, obrigatorio_admissional = ?,
            obrigatorio_periodico = ?, obrigatorio_demissional = ?,
            obrigatorio_retorno_trabalho = ?, obrigatorio_mudanca_risco = ?
        WHERE id = ?
        """,
        (
            exame.nome_exame.strip(), exame.periodicidade_meses,
            1 if exame.obrigatorio_admissional else 0, 1 if exame.obrigatorio_periodico else 0,
            1 if exame.obrigatorio_demissional else 0, 1 if exame.obrigatorio_retorno_trabalho else 0,
            1 if exame.obrigatorio_mudanca_risco else 0, exame_id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Exame da matriz PGR atualizado com sucesso!"}


@app.delete("/api/pgr/exames/{exame_id}")
def excluir_exame_pgr(exame_id: int):
    conn = get_db()
    cur = conn.cursor()
    existente = cur.execute("SELECT id FROM pgr_exames_funcao WHERE id = ?", (exame_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Exame não encontrado na matriz PGR.")

    cur.execute("DELETE FROM pgr_exames_funcao WHERE id = ?", (exame_id,))
    conn.commit()
    conn.close()
    return {"message": "Exame removido da matriz PGR com sucesso!"}


# ----------------------------------------------------------------------
# Ocorrências / SST
# ----------------------------------------------------------------------
@app.get("/api/ocorrencias")
def listar_ocorrencias():
    conn = get_db()
    query = """
        SELECT o.*, o.data_ocorrencia AS data, c.nome AS colaborador_nome, c.cargo AS cargo
        FROM ocorrencias o
        JOIN colaboradores c ON c.id = o.colaborador_id
        ORDER BY o.data_ocorrencia DESC, o.id DESC
    """
    dados = linhas(conn.execute(query).fetchall())
    conn.close()
    return dados


@app.post("/api/ocorrencias")
def registrar_ocorrencia(oc: OcorrenciaCreate):
    conn = get_db()
    cur = conn.cursor()

    colaborador = cur.execute("SELECT id FROM colaboradores WHERE id = ?", (oc.colaborador_id,)).fetchone()
    if not colaborador:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

    if not (oc.tipo or "").strip():
        conn.close()
        raise HTTPException(status_code=400, detail="O tipo de ocorrência é obrigatório.")

    cur.execute(
        """
        INSERT INTO ocorrencias (colaborador_id, tipo, data_ocorrencia, gravidade, status, descricao)
        VALUES (?, ?, ?, ?, 'Pendente', ?)
        """,
        (oc.colaborador_id, oc.tipo.strip(), oc.data, oc.gravidade or "Baixa", oc.descricao),
    )
    conn.commit()
    conn.close()
    return {"message": "Ocorrência registrada com sucesso!"}


@app.patch("/api/ocorrencias/{ocorrencia_id}")
def atualizar_status_ocorrencia(ocorrencia_id: int, dados: OcorrenciaStatusUpdate):
    conn = get_db()
    cur = conn.cursor()

    existente = cur.execute("SELECT id FROM ocorrencias WHERE id = ?", (ocorrencia_id,)).fetchone()
    if not existente:
        conn.close()
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")

    cur.execute("UPDATE ocorrencias SET status = ? WHERE id = ?", (dados.status, ocorrencia_id))
    conn.commit()
    conn.close()
    return {"message": f"Ocorrência marcada como {dados.status}."}


# ----------------------------------------------------------------------
# Configurações (parâmetros globais de alerta)
# ----------------------------------------------------------------------
@app.get("/api/configuracoes")
def obter_configuracoes():
    conn = get_db()
    registros = conn.execute("SELECT chave, valor FROM configuracoes").fetchall()
    conn.close()
    return {row["chave"]: row["valor"] for row in registros}


@app.post("/api/configuracoes")
def salvar_configuracoes(cfg: ConfiguracaoUpdate):
    conn = get_db()
    cur = conn.cursor()

    if cfg.dias_alerta_aso is not None:
        cur.execute(
            "INSERT INTO configuracoes (chave, valor) VALUES ('dias_alerta_aso', ?) "
            "ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
            (str(cfg.dias_alerta_aso),),
        )
    if cfg.dias_alerta_epi is not None:
        cur.execute(
            "INSERT INTO configuracoes (chave, valor) VALUES ('dias_alerta_epi', ?) "
            "ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
            (str(cfg.dias_alerta_epi),),
        )

    conn.commit()
    conn.close()
    return {"message": "Parâmetros salvos com sucesso!"}


# ----------------------------------------------------------------------
# Central de Pendências dinâmica
# ----------------------------------------------------------------------
@app.get("/api/pendencias")
def buscar_pendencias():
    conn = get_db()
    cur = conn.cursor()

    linha_cfg = cur.execute(
        "SELECT valor FROM configuracoes WHERE chave = 'dias_alerta_aso'"
    ).fetchone()
    dias_aso = int(linha_cfg["valor"]) if linha_cfg and linha_cfg["valor"] else 30
    limite_aso = (datetime.now() + timedelta(days=dias_aso)).strftime("%Y-%m-%d")

    asos_criticos = linhas(
        cur.execute(
            """
            SELECT e.*, c.nome AS colaborador_nome, c.setor_id
            FROM pcmso_exames e
            JOIN colaboradores c ON e.colaborador_id = c.id
            WHERE e.data_proximo_exame <= ? AND c.status = 'Ativo' AND e.tipo_exame != 'Demissional'
            ORDER BY e.data_proximo_exame
            """,
            (limite_aso,),
        ).fetchall()
    )

    epis_criticos = linhas(
        cur.execute(
            "SELECT * FROM epis_estoque WHERE quantidade_estoque <= quantidade_minima ORDER BY quantidade_estoque"
        ).fetchall()
    )

    conn.close()
    return {
        "asos_criticos": asos_criticos,
        "epis_estoque_baixo": epis_criticos,
    }