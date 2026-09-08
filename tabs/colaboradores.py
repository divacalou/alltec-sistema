# -*- coding: utf-8 -*-
"""Aba 1: Consulta de Colaboradores e Modal de Cadastro/Edição."""
import tkinter as tk
from tkinter import ttk, messagebox

import theme
from backend.database import ValidacaoError
from utils.mascaras import EntradaMascarada


class JanelaFormularioColaborador(tk.Toplevel):
    """Janela Modal independente para Cadastrar e Editar Colaboradores."""

    def __init__(self, parent, db, colaborador_id=None, on_success=None):
        super().__init__(parent)
        self.db = db
        self.colaborador_id = colaborador_id
        self.on_success = on_success

        self.title("Editar Colaborador" if colaborador_id else "Cadastrar Novo Colaborador")
        self.geometry("620x520")
        self.resizable(False, False)
        self.grab_set()  # Bloqueia a janela principal até fechar o formulário

        self._montar_layout()
        if self.colaborador_id:
            self.carregar_dados()

    def _montar_layout(self):
        container = ttk.Frame(self, padding=20, style="Card.TFrame")
        container.pack(fill="both", expand=True)

        self.vars = {}
        self.entradas = {}

        def rotulo(texto, linha, coluna):
            ttk.Label(container, text=texto, style="Campo.TLabel").grid(
                row=linha, column=coluna, sticky="w", padx=8, pady=4
            )

        def campo_simples(chave, linha, coluna, largura=22):
            var = tk.StringVar()
            entry = ttk.Entry(container, textvariable=var, width=largura)
            entry.grid(row=linha, column=coluna + 1, sticky="w", padx=(0, 8), pady=4)
            self.vars[chave] = var
            return var

        def campo_mascarado(chave, linha, coluna, mascara, largura=22):
            entrada = EntradaMascarada(container, mascara=mascara, width=largura)
            entrada.grid(row=linha, column=coluna + 1, sticky="w", padx=(0, 8), pady=4)
            self.vars[chave] = entrada.var
            self.entradas[chave] = entrada
            return entrada

        linha = 0
        ttk.Label(container, text="Dados Pessoais", style="Subtitulo.TLabel").grid(
            row=linha, column=0, columnspan=4, sticky="w", padx=8, pady=(0, 6)
        )
        linha += 1

        rotulo("Nome Completo*", linha, 0)
        campo_simples("nome", linha, 0, largura=24)
        rotulo("CPF", linha, 2)
        campo_mascarado("cpf", linha, 2, "cpf", largura=18)
        linha += 1

        rotulo("Data Nascimento", linha, 0)
        campo_mascarado("data_nascimento", linha, 0, "data", largura=24)
        rotulo("Telefone", linha, 2)
        campo_mascarado("telefone", linha, 2, "telefone", largura=18)
        linha += 1

        rotulo("Cidade", linha, 0)
        campo_simples("cidade", linha, 0, largura=24)
        linha += 1

        ttk.Separator(container, orient="horizontal").grid(
            row=linha, column=0, columnspan=4, sticky="ew", padx=8, pady=12
        )
        linha += 1

        ttk.Label(container, text="Dados Contratuais", style="Subtitulo.TLabel").grid(
            row=linha, column=0, columnspan=4, sticky="w", padx=8, pady=(0, 6)
        )
        linha += 1

        rotulo("Matrícula", linha, 0)
        campo_simples("matricula", linha, 0, largura=24)
        rotulo("Data Admissão", linha, 2)
        campo_mascarado("data_admissao", linha, 2, "data", largura=18)
        linha += 1

        rotulo("Função", linha, 0)
        campo_simples("funcao", linha, 0, largura=24)
        rotulo("Setor", linha, 2)
        campo_simples("setor", linha, 2, largura=18)
        linha += 1

        rotulo("Tipo de Contrato", linha, 0)
        self.var_tipo_contrato = tk.StringVar(value=theme.TIPOS_CONTRATO[0])
        ttk.Combobox(
            container, textvariable=self.var_tipo_contrato, values=theme.TIPOS_CONTRATO,
            state="readonly", width=22,
        ).grid(row=linha, column=1, sticky="w", padx=(0, 8), pady=4)

        rotulo("Status", linha, 2)
        self.var_status = tk.StringVar(value="Ativo")
        ttk.Combobox(
            container, textvariable=self.var_status, values=theme.STATUS_COLABORADOR,
            state="readonly", width=16,
        ).grid(row=linha, column=3, sticky="w", padx=(0, 8), pady=4)
        linha += 1

        rotulo("Salário Base (R$)", linha, 0)
        campo_mascarado("salario_base", linha, 0, "moeda", largura=24)
        rotulo("Data Desligamento", linha, 2)
        campo_mascarado("data_desligamento", linha, 2, "data", largura=18)
        linha += 1

        rotulo("Dados Bancários/PIX", linha, 0)
        campo_simples("dados_bancarios", linha, 0, largura=24)
        linha += 1

        # Botões de Ação na base do Modal
        botoes = ttk.Frame(container, style="Card.TFrame")
        botoes.grid(row=linha, column=0, columnspan=4, sticky="e", pady=(20, 0))

        ttk.Button(botoes, text="Cancelar", command=self.destroy).pack(side="right", padx=6)
        ttk.Button(botoes, text="Salvar Registro", style="Primario.TButton", command=self.salvar).pack(
            side="right", padx=6
        )

    def _coletar_dados(self):
        dados = {}
        for chave, var in self.vars.items():
            dados[chave] = var.get().strip()
        dados["tipo_contrato"] = self.var_tipo_contrato.get()
        dados["status"] = self.var_status.get()
        entrada_salario = self.entradas.get("salario_base")
        dados["salario_base"] = entrada_salario.valor_numerico() if entrada_salario else 0.0
        return dados

    def _validar_datas(self):
        campos_data = ["data_nascimento", "data_admissao", "data_desligamento"]
        rotulos = {
            "data_nascimento": "Data de Nascimento",
            "data_admissao": "Data de Admissão",
            "data_desligamento": "Data de Desligamento",
        }
        for chave in campos_data:
            entrada = self.entradas.get(chave)
            if entrada and not entrada.data_valida_ou_vazia():
                messagebox.showwarning(
                    "Data inválida",
                    f"O campo '{rotulos[chave]}' contém uma data inválida. Use dd/mm/aaaa.",
                    parent=self
                )
                entrada.focus_set()
                return False
        return True

    def salvar(self):
        if not self._validar_datas():
            return
        dados = self._coletar_dados()
        if not dados.get("nome"):
            messagebox.showwarning("Campo obrigatório", "Informe o nome do colaborador.", parent=self)
            return

        cpf = dados.get("cpf") or None
        matricula = dados.get("matricula") or None
        if cpf and self.db.cpf_existe(cpf, excluir_id=self.colaborador_id):
            messagebox.showwarning("CPF já cadastrado", "Já existe um colaborador com este CPF.", parent=self)
            return
        if matricula and self.db.matricula_existe(matricula, excluir_id=self.colaborador_id):
            messagebox.showwarning("Matrícula cadastrada", "Já existe um colaborador com esta matrícula.", parent=self)
            return

        try:
            self.db.salvar_colaborador(dados, self.colaborador_id)
        except ValidacaoError as exc:
            messagebox.showwarning("Não foi possível salvar", str(exc), parent=self)
            return
        except Exception as exc:
            messagebox.showerror("Erro ao salvar", f"Erro crítico: {exc}", parent=self)
            return

        messagebox.showinfo("Sucesso", "Registro salvo com sucesso!", parent=self)
        if self.on_success:
            self.on_success()
        self.destroy()

    def carregar_dados(self):
        col = self.db.obter_colaborador(self.colaborador_id)
        if not col:
            return
        for chave, var in self.vars.items():
            valor = col[chave] if chave in col.keys() else ""
            if chave == "salario_base":
                entrada = self.entradas.get(chave)
                if entrada is not None:
                    try:
                        centavos = int(round(float(valor or 0) * 100))
                    except (TypeError, ValueError):
                        centavos = 0
                    var.set(entrada._formatar(str(centavos)) if centavos else "")
                continue
            var.set("" if valor is None else str(valor))
        self.var_tipo_contrato.set(col["tipo_contrato"] or theme.TIPOS_CONTRATO[0])
        self.var_status.set(col["status"] or "Ativo")


# ======================================================================
# ABA PRINCIPAL DE CONSULTA E LISTAGEM
# ======================================================================
class ColaboradoresTab(ttk.Frame):
    def __init__(self, parent, db, on_change=None):
        super().__init__(parent, style="Fundo.TFrame")
        self.db = db
        self.on_change = on_change
        self.colaborador_id_selecionado = None
        self._montar_layout()
        self.atualizar_lista()

    def _montar_layout(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

        # ---------------- Barra Superior (Ações & Busca) ----------------
        topo_frame = ttk.Frame(self, style="Fundo.TFrame")
        topo_frame.grid(row=0, column=0, sticky="ew", padx=15, pady=(15, 10))

        # Ações do Lado Esquerdo (Botões Primários)
        btn_frame = ttk.Frame(topo_frame, style="Fundo.TFrame")
        btn_frame.pack(side="left")

        ttk.Button(
            btn_frame, text="+ Novo Colaborador", style="Primario.TButton", command=self.novo_colaborador
        ).pack(side="left", padx=(0, 6))

        ttk.Button(
            btn_frame, text="Editar Selecionado", command=self.carregar_para_edicao
        ).pack(side="left", padx=6)

        ttk.Button(
            btn_frame, text="Excluir", style="Perigo.TButton", command=self.excluir
        ).pack(side="left", padx=6)

        # Filtro de Busca do Lado Direito
        busca_frame = ttk.Frame(topo_frame, style="Fundo.TFrame")
        busca_frame.pack(side="right")

        ttk.Label(busca_frame, text="Buscar:", style="Campo.TLabel").pack(side="left", padx=(0, 6))
        self.var_busca = tk.StringVar()
        entrada_busca = ttk.Entry(busca_frame, textvariable=self.var_busca, width=28)
        entrada_busca.pack(side="left")
        entrada_busca.bind("<KeyRelease>", lambda e: self.atualizar_lista())

        ttk.Button(busca_frame, text="Limpar", command=self._limpar_filtro).pack(side="left", padx=(6, 0))

        # ---------------- Tabela Expansível (Full Screen) ----------------
        lista_frame = ttk.Frame(self, style="Fundo.TFrame")
        lista_frame.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0, 15))
        lista_frame.columnconfigure(0, weight=1)
        lista_frame.rowconfigure(0, weight=1)

        colunas = ("matricula", "nome", "cpf", "funcao", "setor", "tipo_contrato", "status")
        titulos = {
            "matricula": "Matrícula",
            "nome": "Nome Completo",
            "cpf": "CPF",
            "funcao": "Função",
            "setor": "Setor",
            "tipo_contrato": "Contrato",
            "status": "Status",
        }
        anchors = {
            "matricula": "center",
            "nome": "w",
            "cpf": "center",
            "funcao": "w",
            "setor": "w",
            "tipo_contrato": "w",
            "status": "center",
        }

        self.tree = ttk.Treeview(lista_frame, columns=colunas, show="headings", style="Planna.Treeview")
        for c in colunas:
            self.tree.heading(c, text=titulos[c])
            # Distribuição automática de larguras
            largura = 220 if c == "nome" else 110
            self.tree.column(c, width=largura, anchor=anchors[c])

        self.tree.grid(row=0, column=0, sticky="nsew")

        scroll = ttk.Scrollbar(lista_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        scroll.grid(row=0, column=1, sticky="ns")

        self.tree.bind("<<TreeviewSelect>>", self._on_select)
        self.tree.bind("<Double-1>", self._on_double_click)

        self.tree.tag_configure("status_ativo", background=theme.COR_LINHA_ATIVO)
        self.tree.tag_configure("status_afastado", background=theme.COR_LINHA_AFASTADO)
        self.tree.tag_configure("status_desligado", background=theme.COR_LINHA_DESLIGADO)

    # ------------------------------------------------------------------
    def _limpar_filtro(self):
        self.var_busca.set("")
        self.atualizar_lista()

    def _on_select(self, event=None):
        selecao = self.tree.selection()
        if not selecao:
            self.colaborador_id_selecionado = None
            return
        self.colaborador_id_selecionado = int(self.tree.item(selecao[0], "tags")[-1])

    def _on_double_click(self, event=None):
        self._on_select()
        self.carregar_para_edicao()

    def _tag_status(self, status):
        status = (status or "").strip().lower()
        if status == "afastado":
            return "status_afastado"
        if status == "desligado":
            return "status_desligado"
        return "status_ativo"

    def atualizar_lista(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for col in self.db.listar_colaboradores(self.var_busca.get().strip() or None):
            self.tree.insert(
                "",
                "end",
                values=(
                    col["matricula"] or "",
                    col["nome"] or "",
                    col["cpf"] or "",
                    col["funcao"] or "",
                    col["setor"] or "",
                    col["tipo_contrato"] or "",
                    col["status"] or "",
                ),
                tags=(self._tag_status(col["status"]), str(col["id"])),
            )

    def obter_lista_colaboradores_simples(self):
        return [(c["id"], c["nome"]) for c in self.db.listar_colaboradores()]

    def novo_colaborador(self):
        JanelaFormularioColaborador(self, db=self.db, on_success=self._ao_salvar_registro)

    def carregar_para_edicao(self):
        if not self.colaborador_id_selecionado:
            messagebox.showinfo("Selecione", "Selecione um colaborador na lista para editar.")
            return
        JanelaFormularioColaborador(
            self,
            db=self.db,
            colaborador_id=self.colaborador_id_selecionado,
            on_success=self._ao_salvar_registro,
        )

    def _ao_salvar_registro(self):
        self.atualizar_lista()
        if self.on_change:
            self.on_change()

    def excluir(self):
        if not self.colaborador_id_selecionado:
            messagebox.showinfo("Selecione", "Selecione um colaborador na lista para excluir.")
            return
        if messagebox.askyesno(
            "Confirmar exclusão",
            "Excluir este colaborador removerá também seus EPIs, exames e ocorrências. Continuar?",
        ):
            self.db.excluir_colaborador(self.colaborador_id_selecionado)
            self.colaborador_id_selecionado = None
            self.atualizar_lista()
            if self.on_change:
                self.on_change()