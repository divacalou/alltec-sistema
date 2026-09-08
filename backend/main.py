from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
import os

# 1. Criação da aplicação FastAPI
app = FastAPI(title="PLANNARH API")

# 2. Configuração do CORS (libera o frontend React/Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Conexão com o banco SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), "planna_dados.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 4. Modelos de Dados (Pydantic)
class OcorrenciaCreate(BaseModel):
    colaborador_id: int
    tipo: str
    data: str
    gravidade: str
    descricao: Optional[str] = ""
    status: Optional[str] = "Pendente"

# --- ROTAS DA API ---

@app.get("/")
def home():
    return {"status": "API PLANNARH conectada com sucesso ao banco de dados!"}

@app.get("/api/kpis")
def get_kpis():
    conn = get_db_connection()
    cursor = conn.cursor()

    def get_count(table_name):
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            return cursor.fetchone()[0]
        except Exception:
            return 0

    total_colaboradores = get_count("colaboradores")
    total_epis = get_count("epis")
    total_exames = get_count("exames")
    total_ocorrencias = get_count("ocorrencias")

    conn.close()

    return {
        "total_colaboradores": total_colaboradores,
        "admissoes_mes": total_epis,
        "afastamentos_mes": total_exames,
        "ocorrencias_mes": total_ocorrencias
    }

@app.get("/api/colaboradores/setores")
def get_colaboradores_por_setor():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT setor, COUNT(*) as quantidade FROM colaboradores GROUP BY setor")
        rows = cursor.fetchall()
        data = [{"setor": row["setor"] if row["setor"] else "Outros", "quantidade": row["quantidade"]} for row in rows]
    except Exception:
        data = []

    conn.close()
    return data

@app.get("/api/colaboradores")
def get_colaboradores(busca: str = "", setor: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM colaboradores WHERE 1=1"
    params = []
    
    if busca:
        query += " AND (nome LIKE ? OR cpf LIKE ? OR cargo LIKE ?)"
        term = f"%{busca}%"
        params.extend([term, term, term])
        
    if setor:
        query += " AND setor = ?"
        params.append(setor)
        
    query += " ORDER BY nome ASC"
    
    try:
        colaboradores = cursor.execute(query, params).fetchall()
        result = [dict(row) for row in colaboradores]
    except Exception as e:
        result = []
    finally:
        conn.close()
    
    return result

@app.get("/api/ocorrencias")
def get_ocorrencias():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            o.id, 
            o.tipo, 
            o.data, 
            o.gravidade, 
            o.status, 
            o.descricao,
            c.nome AS colaborador_nome
        FROM ocorrencias o
        LEFT JOIN colaboradores c ON o.colaborador_id = c.id
        ORDER BY o.id DESC
    """
    try:
        rows = cursor.execute(query).fetchall()
        result = [dict(row) for row in rows]
    except Exception:
        result = []
    finally:
        conn.close()
        
    return result

@app.post("/api/ocorrencias")
def create_ocorrencia(ocorrencia: OcorrenciaCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ocorrencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                colaborador_id INTEGER,
                tipo TEXT,
                data TEXT,
                gravidade TEXT,
                status TEXT,
                descricao TEXT
            )
        """)
        
        cursor.execute("""
            INSERT INTO ocorrencias (colaborador_id, tipo, data, gravidade, status, descricao)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            ocorrencia.colaborador_id,
            ocorrencia.tipo,
            ocorrencia.data,
            ocorrencia.gravidade,
            ocorrencia.status,
            ocorrencia.descricao
        ))
        
        conn.commit()
        return {"status": "sucesso", "mensagem": "Ocorrência registrada com sucesso!"}
    except Exception as e:
        return {"status": "erro", "detalhe": str(e)}
    finally:
        conn.close()