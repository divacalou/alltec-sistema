# -*- coding: utf-8 -*-
"""
Camada de acesso a dados (SQLite) do Sistema de Gestão Local de Funcionários & SST - PLANNA.
Banco 100% local: arquivo planna_dados.db gravado no mesmo diretório do programa.
"""
import os
import sqlite3
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "planna_dados.db")

DATE_FMT = "%d/%m/%Y"


class ValidacaoError(Exception):
    """Erro de validação amigável (ex.: CPF/matrícula duplicados) para exibir ao usuário."""


def hoje_str():
    return datetime.now().strftime(DATE_FMT)


def parse_data(data_str):
    """Converte string dd/mm/aaaa em datetime. Retorna None se inválida/vazia."""
    if not data_str:
        return None
    try:
        return datetime.strptime(data_str.strip(), DATE_FMT)
    except ValueError:
        return None


def formatar_data(dt):
    if not dt:
        return ""
    return dt.strftime(DATE_FMT)


def somar_dias(data_str, dias):
    dt = parse_data(data_str)
    if not dt:
        return ""
    return formatar_data(dt + timedelta(days=dias))


def somar_meses(data_str, meses):
    dt = parse_data(data_str)
    if not dt:
        return ""
    mes = dt.month - 1 + meses
    ano = dt.year + mes // 12
    mes = mes % 12 + 1
    dia = min(
        dt.day,
        [
            31,
            29 if ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0) else 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ][mes - 1],
    )
    return formatar_data(datetime(ano, mes, dia))


def _vazio_para_none(dados, campos):
    """Converte strings vazias em None para os campos indicados.

    Isso é essencial para colunas com restrição UNIQUE (cpf, matricula):
    o SQLite trata múltiplos valores NULL como distintos entre si, mas
    trata múltiplas strings vazias '' como iguais - o que quebraria o
    cadastro de um segundo colaborador sem CPF/matrícula preenchido.
    """
    dados = dict(dados)
    for campo in campos:
        if campo in dados and (dados[campo] is None or str(dados[campo]).strip() == ""):
            dados[campo] = None
    return dados


class Database:
    def __init__(self, path=DB_PATH):
        self.path = path
        self.conn = sqlite3.connect(self.path)
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.row_factory = sqlite3.Row
        self._criar_tabelas()

    # ------------------------------------------------------------------
    # Estrutura
    # ------------------------------------------------------------------
    def _criar_tabelas(self):
        cur = self.conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS colaboradores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cpf TEXT UNIQUE,
                data_nascimento TEXT,
                telefone TEXT,
                cidade TEXT,
                matricula TEXT UNIQUE,
                funcao TEXT,
                setor TEXT,
                data_admissao TEXT,
                tipo_contrato TEXT,
                salario_base REAL,
                dados_bancarios TEXT,
                status TEXT DEFAULT 'Ativo',
                data_desligamento TEXT,
                criado_em TEXT
            );

            CREATE TABLE IF NOT EXISTS epis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                colaborador_id INTEGER NOT NULL,
                nome_epi TEXT NOT NULL,
                numero_ca TEXT,
                data_entrega TEXT,
                quantidade INTEGER DEFAULT 1,
                validade_dias INTEGER,
                data_proxima_troca TEXT,
                observacoes TEXT,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exames (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                colaborador_id INTEGER NOT NULL,
                tipo_exame TEXT NOT NULL,
                data_realizacao TEXT,
                periodicidade_meses INTEGER,
                data_proximo_exame TEXT,
                resultado TEXT,
                medico TEXT,
                observacoes TEXT,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ocorrencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                colaborador_id INTEGER NOT NULL,
                data TEXT,
                tipo TEXT,
                descricao TEXT,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            );
            """
        )
        self.conn.commit()

    # ------------------------------------------------------------------
    # Colaboradores
    # ------------------------------------------------------------------
    def cpf_existe(self, cpf, excluir_id=None):
        if not cpf:
            return False
        cur = self.conn.cursor()
        if excluir_id:
            cur.execute("SELECT id FROM colaboradores WHERE cpf = ? AND id != ?", (cpf, excluir_id))
        else:
            cur.execute("SELECT id FROM colaboradores WHERE cpf = ?", (cpf,))
        return cur.fetchone() is not None

    def matricula_existe(self, matricula, excluir_id=None):
        if not matricula:
            return False
        cur = self.conn.cursor()
        if excluir_id:
            cur.execute(
                "SELECT id FROM colaboradores WHERE matricula = ? AND id != ?",
                (matricula, excluir_id),
            )
        else:
            cur.execute("SELECT id FROM colaboradores WHERE matricula = ?", (matricula,))
        return cur.fetchone() is not None

    def salvar_colaborador(self, dados, colaborador_id=None):
        """Insere ou atualiza um colaborador.

        Levanta ValidacaoError (com mensagem amigável) se o CPF ou a
        matrícula já pertencerem a outro colaborador.
        """
        dados = _vazio_para_none(dados, ["cpf", "matricula"])
        cur = self.conn.cursor()
        try:
            if colaborador_id:
                campos = ", ".join(f"{k} = ?" for k in dados.keys())
                valores = list(dados.values()) + [colaborador_id]
                cur.execute(f"UPDATE colaboradores SET {campos} WHERE id = ?", valores)
            else:
                dados["criado_em"] = hoje_str()
                campos = ", ".join(dados.keys())
                interrogacoes = ", ".join(["?"] * len(dados))
                cur.execute(
                    f"INSERT INTO colaboradores ({campos}) VALUES ({interrogacoes})",
                    list(dados.values()),
                )
                colaborador_id = cur.lastrowid
            self.conn.commit()
            return colaborador_id
        except sqlite3.IntegrityError as exc:
            self.conn.rollback()
            msg = str(exc).lower()
            if "cpf" in msg:
                raise ValidacaoError(
                    "Já existe um colaborador cadastrado com este CPF."
                ) from exc
            if "matricula" in msg:
                raise ValidacaoError(
                    "Já existe um colaborador cadastrado com esta matrícula."
                ) from exc
            raise ValidacaoError(
                "Não foi possível salvar: verifique se há dados duplicados ou inválidos."
            ) from exc

    def excluir_colaborador(self, colaborador_id):
        self.conn.execute("DELETE FROM colaboradores WHERE id = ?", (colaborador_id,))
        self.conn.commit()

    def listar_colaboradores(self, filtro=None):
        cur = self.conn.cursor()
        if filtro:
            like = f"%{filtro}%"
            cur.execute(
                "SELECT * FROM colaboradores WHERE nome LIKE ? OR matricula LIKE ? OR cpf LIKE ? "
                "ORDER BY nome",
                (like, like, like),
            )
        else:
            cur.execute("SELECT * FROM colaboradores ORDER BY nome")
        return cur.fetchall()

    def obter_colaborador(self, colaborador_id):
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM colaboradores WHERE id = ?", (colaborador_id,))
        return cur.fetchone()

    # ------------------------------------------------------------------
    # EPIs
    # ------------------------------------------------------------------
    def salvar_epi(self, dados, epi_id=None):
        dados = dict(dados)
        dados["data_proxima_troca"] = somar_dias(
            dados.get("data_entrega", ""), int(dados.get("validade_dias") or 0)
        )
        cur = self.conn.cursor()
        if epi_id:
            campos = ", ".join(f"{k} = ?" for k in dados.keys())
            valores = list(dados.values()) + [epi_id]
            cur.execute(f"UPDATE epis SET {campos} WHERE id = ?", valores)
        else:
            campos = ", ".join(dados.keys())
            interrogacoes = ", ".join(["?"] * len(dados))
            cur.execute(f"INSERT INTO epis ({campos}) VALUES ({interrogacoes})", list(dados.values()))
            epi_id = cur.lastrowid
        self.conn.commit()
        return epi_id

    def excluir_epi(self, epi_id):
        self.conn.execute("DELETE FROM epis WHERE id = ?", (epi_id,))
        self.conn.commit()

    def listar_epis(self, colaborador_id=None):
        cur = self.conn.cursor()
        if colaborador_id:
            cur.execute(
                "SELECT epis.*, colaboradores.nome AS colaborador_nome FROM epis "
                "JOIN colaboradores ON colaboradores.id = epis.colaborador_id "
                "WHERE colaborador_id = ? ORDER BY data_entrega DESC",
                (colaborador_id,),
            )
        else:
            cur.execute(
                "SELECT epis.*, colaboradores.nome AS colaborador_nome FROM epis "
                "JOIN colaboradores ON colaboradores.id = epis.colaborador_id "
                "ORDER BY data_proxima_troca"
            )
        return cur.fetchall()

    # ------------------------------------------------------------------
    # Exames / ASO
    # ------------------------------------------------------------------
    def salvar_exame(self, dados, exame_id=None):
        dados = dict(dados)
        dados["data_proximo_exame"] = somar_meses(
            dados.get("data_realizacao", ""), int(dados.get("periodicidade_meses") or 0)
        )
        cur = self.conn.cursor()
        if exame_id:
            campos = ", ".join(f"{k} = ?" for k in dados.keys())
            valores = list(dados.values()) + [exame_id]
            cur.execute(f"UPDATE exames SET {campos} WHERE id = ?", valores)
        else:
            campos = ", ".join(dados.keys())
            interrogacoes = ", ".join(["?"] * len(dados))
            cur.execute(f"INSERT INTO exames ({campos}) VALUES ({interrogacoes})", list(dados.values()))
            exame_id = cur.lastrowid
        self.conn.commit()
        return exame_id

    def excluir_exame(self, exame_id):
        self.conn.execute("DELETE FROM exames WHERE id = ?", (exame_id,))
        self.conn.commit()

    def listar_exames(self, colaborador_id=None):
        cur = self.conn.cursor()
        if colaborador_id:
            cur.execute(
                "SELECT exames.*, colaboradores.nome AS colaborador_nome FROM exames "
                "JOIN colaboradores ON colaboradores.id = exames.colaborador_id "
                "WHERE colaborador_id = ? ORDER BY data_realizacao DESC",
                (colaborador_id,),
            )
        else:
            cur.execute(
                "SELECT exames.*, colaboradores.nome AS colaborador_nome FROM exames "
                "JOIN colaboradores ON colaboradores.id = exames.colaborador_id "
                "ORDER BY data_proximo_exame"
            )
        return cur.fetchall()

    # ------------------------------------------------------------------
    # Ocorrências
    # ------------------------------------------------------------------
    def salvar_ocorrencia(self, dados, ocorrencia_id=None):
        cur = self.conn.cursor()
        if ocorrencia_id:
            campos = ", ".join(f"{k} = ?" for k in dados.keys())
            valores = list(dados.values()) + [ocorrencia_id]
            cur.execute(f"UPDATE ocorrencias SET {campos} WHERE id = ?", valores)
        else:
            campos = ", ".join(dados.keys())
            interrogacoes = ", ".join(["?"] * len(dados))
            cur.execute(
                f"INSERT INTO ocorrencias ({campos}) VALUES ({interrogacoes})",
                list(dados.values()),
            )
            ocorrencia_id = cur.lastrowid
        self.conn.commit()
        return ocorrencia_id

    def excluir_ocorrencia(self, ocorrencia_id):
        self.conn.execute("DELETE FROM ocorrencias WHERE id = ?", (ocorrencia_id,))
        self.conn.commit()

    def listar_ocorrencias(self, colaborador_id=None):
        cur = self.conn.cursor()
        if colaborador_id:
            cur.execute(
                "SELECT ocorrencias.*, colaboradores.nome AS colaborador_nome FROM ocorrencias "
                "JOIN colaboradores ON colaboradores.id = ocorrencias.colaborador_id "
                "WHERE colaborador_id = ? ORDER BY data DESC",
                (colaborador_id,),
            )
        else:
            cur.execute(
                "SELECT ocorrencias.*, colaboradores.nome AS colaborador_nome FROM ocorrencias "
                "JOIN colaboradores ON colaboradores.id = ocorrencias.colaborador_id "
                "ORDER BY data DESC"
            )
        return cur.fetchall()

    def fechar(self):
        self.conn.close()