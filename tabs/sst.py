# -*- coding: utf-8 -*-
"""Aba 2: SST & Medicina Ocupacional (Grau de Risco 3) - EPIs e PCMSO/ASO."""
import tkinter as tk
from tkinter import ttk, messagebox

import theme
from backend.database import hoje_str


# ======================================================================
# COMPONENTE REUTILIZÁVEL
# ======================================================================
class ComboColaborador(ttk.Combobox):
    """Combobox reutilizável que mapeia 'Nome (Matrícula)' -> id do colaborador."""

    def __init__(self, master, db, **kwargs):
        self.db = db
        self.var = tk.StringVar()
        super().__init__(master, textvariable=self.var, state="readonly", width=34, **kwargs)
        self._mapa = {}
        self.atualizar()

    def atualizar(self):
        colaboradores = self.db.listar_colaboradores()
        self._mapa = {}
        valores = []
        for c in colaboradores:
            rotulo = f'{c["nome"]} ({c["matricula"] or "s/ matrícula"})'
            self._mapa[rotulo] = c["id"]
            valores.append(rotulo)
        self["values"] = valores
        if valores and self.var.get() not in valores:
            self.var.set("")

    def id_selecionado(self):
        return self._mapa.get(self.var.get())


# ======================================================================
# JANELAS MODAIS (POPUPS)
# ======================================================================
class JanelaFormularioEPI(tk.Toplevel):
    """Janela Modal para Cadastrar/Editar Entrega de EPI."""

    def __init__(self, parent, db, epi_id=None, on_success=None):
        super().__init__(parent)
        self.db = db
        self.epi_id = epi_id
        self.on_success = on_success

        self.title("Editar Registro de EPI" if epi_id else "Registrar Entrega de EPI")
        self.geometry("480x420")
        self.resizable(False, False)
        self.grab_set()

        self.vars_epi = {}
        self._montar_layout()
        if self.epi_id:
            self.carregar_dados()

    def _montar_layout(self):
        container = ttk.Frame(self, padding=20, style="Card.TFrame")
        container.pack(fill="both", expand=True)

        ttk.Label(container, text="Colaborador*", style="Campo.TLabel").grid(
            row=0, column=0, sticky="w", padx=4, pady=6
        )
        self.combo_colaborador = ComboColaborador(container, self.db)
        self.combo_colaborador.grid(row=0, column=1, sticky="ew", padx=4, pady=6)

        campos = [
            ("nome_epi", "Nome do EPI*"),
            ("numero_ca", "Número do CA"),
            ("data_entrega", "Data de Entrega (dd/mm/aaaa)"),
            ("quantidade", "Quantidade"),
            ("validade_dias", "Validade (dias até troca)"),
            ("observacoes", "Observações"),
        ]

        linha = 1
        for chave, rotulo in campos:
            ttk.Label(container, text=rotulo, style="Campo.TLabel").grid(
                row=linha, column=0, sticky="w", padx=4, pady=6
            )
            var = tk.StringVar()
            if chave == "data_entrega":
                var.set(hoje_str())
            ttk.Entry(container, textvariable=var, width=28).grid(
                row=linha, column=1, sticky="ew", padx=4, pady=6
            )
            self.vars_epi[chave] = var
            linha += 1

        container.columnconfigure(1, weight=1)

        botoes = ttk.Frame(container, style="Card.TFrame")
        botoes.grid(row=linha, column=0, columnspan=2, sticky="e", pady=(15, 0))

        ttk.Button(botoes, text="Cancelar", command=self.destroy).pack(side="right", padx=6)
        ttk.Button(
            botoes, text="Salvar Registro", style="Primario.TButton", command=self.salvar
        ).pack(side="right", padx=6)

    def salvar(self):
        colaborador_id = self.combo_colaborador.id_selecionado()
        if not colaborador_id:
            messagebox.showwarning("Campo obrigatório", "Selecione o colaborador.", parent=self)
            return

        dados = {k: v.get().strip() for k, v in self.vars_epi.items()}
        if not dados.get("nome_epi"):
            messagebox.showwarning("Campo obrigatório", "Informe o nome do EPI.", parent=self)
            return

        dados["colaborador_id"] = colaborador_id
        try:
            dados["quantidade"] = int(dados.get("quantidade") or 1)
        except ValueError:
            dados["quantidade"] = 1

        try:
            dados["validade_dias"] = int(dados.get("validade_dias") or 0)
        except ValueError:
            dados["validade_dias"] = 0

        try:
            self.db.salvar_epi(dados, self.epi_id)
        except Exception as exc:
            messagebox.showerror("Erro ao salvar", f"Não foi possível salvar: {exc}", parent=self)
            return

        messagebox.showinfo("Sucesso", "EPI registrado com sucesso!", parent=self)
        if self.on_success:
            self.on_success()
        self.destroy()

    def carregar_dados(self):
        registros = [e for e in self.db.listar_epis() if e["id"] == self.epi_id]
        if not registros:
            return
        epi = registros[0]
        for chave, var in self.vars_epi.items():
            valor = epi[chave] if chave in epi.keys() else ""
            var.set("" if valor is None else str(valor))
        for rotulo, cid in self.combo_colaborador._mapa.items():
            if cid == epi["colaborador_id"]:
                self.combo_colaborador.var.set(rotulo)
                break


class JanelaFormularioExame(tk.Toplevel):
    """Janela Modal para Cadastrar/Editar Exame Ocupacional (ASO)."""

    def __init__(self, parent, db, exame_id=None, on_success=None):
        super().__init__(parent)
        self.db = db
        self.exame_id = exame_id
        self.on_success = on_success

        self.title("Editar Exame Ocupacional" if exame_id else "Registrar Novo Exame / ASO")
        self.geometry("480x420")
        self.resizable(False, False)
        self.grab_set()

        self.vars_exame = {}
        self._montar_layout()
        if self.exame_id:
            self.carregar_dados()

    def _montar_layout(self):
        container = ttk.Frame(self, padding=20, style="Card.TFrame")
        container.pack(fill="both", expand=True)

        ttk.Label(container, text="Colaborador*", style="Campo.TLabel").grid(
            row=0, column=0, sticky="w", padx=4, pady=6
        )
        self.combo_colaborador = ComboColaborador(container, self.db)
        self.combo_colaborador.grid(row=0, column=1, sticky="ew", padx=4, pady=6)

        ttk.Label(container, text="Tipo de Exame", style="Campo.TLabel").grid(
            row=1, column=0, sticky="w", padx=4, pady=6
        )
        self.var_tipo_exame = tk.StringVar(value=theme.TIPOS_EXAME[0])
        ttk.Combobox(
            container,
            textvariable=self.var_tipo_exame,
            values=theme.TIPOS_EXAME,
            state="readonly",
            width=26,
        ).grid(row=1, column=1, sticky="w", padx=4, pady=6)

        campos = [
            ("data_realizacao", "Data de Realização (dd/mm/aaaa)"),
            ("periodicidade_meses", "Periodicidade (meses)"),
            ("medico", "Médico Responsável"),
            ("observacoes", "Observações"),
        ]

        linha = 2
        for chave, rotulo in campos:
            ttk.Label(container, text=rotulo, style="Campo.TLabel").grid(
                row=linha, column=0, sticky="w", padx=4, pady=6
            )
            var = tk.StringVar()
            if chave == "data_realizacao":
                var.set(hoje_str())
            ttk.Entry(container, textvariable=var, width=28).grid(
                row=linha, column=1, sticky="ew", padx=4, pady=6
            )
            self.vars_exame[chave] = var
            linha += 1

        ttk.Label(container, text="Resultado", style="Campo.TLabel").grid(
            row=linha, column=0, sticky="w", padx=4, pady=6
        )
        self.var_resultado = tk.StringVar(value=theme.RESULTADOS_EXAME[0])
        ttk.Combobox(
            container,
            textvariable=self.var_resultado,
            values=theme.RESULTADOS_EXAME,
            state="readonly",
            width=26,
        ).grid(row=linha, column=1, sticky="w", padx=4, pady=6)

        container.columnconfigure(1, weight=1)

        botoes = ttk.Frame(container, style="Card.TFrame")
        botoes.grid(row=linha + 1, column=0, columnspan=2, sticky="e", pady=(15, 0))

        ttk.Button(botoes, text="Cancelar", command=self.destroy).pack(side="right", padx=6)
        ttk.Button(
            botoes, text="Salvar Exame", style="Primario.TButton", command=self.salvar
        ).pack(side="right", padx=6)

    def salvar(self):
        colaborador_id = self.combo_colaborador.id_selecionado()
        if not colaborador_id:
            messagebox.showwarning("Campo obrigatório", "Selecione o colaborador.", parent=self)
            return

        dados = {k: v.get().strip() for k, v in self.vars_exame.items()}
        dados["tipo_exame"] = self.var_tipo_exame.get()
        dados["resultado"] = self.var_resultado.get()
        dados["colaborador_id"] = colaborador_id

        try:
            dados["periodicidade_meses"] = int(dados.get("periodicidade_meses") or 0)
        except ValueError:
            dados["periodicidade_meses"] = 0

        try:
            self.db.salvar_exame(dados, self.exame_id)
        except Exception as exc:
            messagebox.showerror("Erro ao salvar", f"Não foi possível salvar: {exc}", parent=self)
            return

        messagebox.showinfo("Sucesso", "Exame/ASO registrado com sucesso!", parent=self)
        if self.on_success:
            self.on_success()
        self.destroy()

    def carregar_dados(self):
        registros = [e for e in self.db.listar_exames() if e["id"] == self.exame_id]
        if not registros:
            return
        ex = registros[0]
        for chave, var in self.vars_exame.items():
            valor = ex[chave] if chave in ex.keys() else ""
            var.set("" if valor is None else str(valor))
        self.var_tipo_exame.set(ex["tipo_exame"] or theme.TIPOS_EXAME[0])
        self.var_resultado.set(ex["resultado"] or theme.RESULTADOS_EXAME[0])
        for rotulo, cid in self.combo_colaborador._mapa.items():
            if cid == ex["colaborador_id"]:
                self.combo_colaborador.var.set(rotulo)
                break


# ======================================================================
# ABA PRINCIPAL DE SST E MEDICINA
# ======================================================================
class SSTTab(ttk.Frame):
    def __init__(self, parent, db, on_change=None):
        super().__init__(parent, style="Fundo.TFrame")
        self.db = db
        self.on_change = on_change
        self.epi_id_selecionado = None
        self.exame_id_selecionado = None

        sub = ttk.Notebook(self)
        sub.pack(fill="both", expand=True, padx=10, pady=10)

        self.aba_epi = ttk.Frame(sub, style="Fundo.TFrame")
        self.aba_exames = ttk.Frame(sub, style="Fundo.TFrame")
        sub.add(self.aba_epi, text="Fichas de EPIs")
        sub.add(self.aba_exames, text="PCMSO & Exames Ocupacionais (ASO)")

        self._montar_epi()
        self._montar_exames()

    # ==================================================================
    # SUB-ABA 1: EPIs
    # ==================================================================
    def _montar_epi(self):
        frame = self.aba_epi
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)

        # Barra Superior de Ações
        topo_frame = ttk.Frame(frame, style="Fundo.TFrame")
        topo_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))

        ttk.Button(
            topo_frame,
            text="+ Entregar EPI",
            style="Primario.TButton",
            command=self.novo_epi,
        ).pack(side="left", padx=(0, 6))

        ttk.Button(
            topo_frame, text="Editar Selecionado", command=self.carregar_epi_edicao
        ).pack(side="left", padx=6)

        ttk.Button(
            topo_frame, text="Excluir", style="Perigo.TButton", command=self.excluir_epi
        ).pack(side="left", padx=6)

        # Tabela Full Screen
        lista_frame = ttk.Frame(frame, style="Fundo.TFrame")
        lista_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        lista_frame.columnconfigure(0, weight=1)
        lista_frame.rowconfigure(0, weight=1)

        colunas = (
            "colaborador_nome",
            "nome_epi",
            "numero_ca",
            "data_entrega",
            "quantidade",
            "data_proxima_troca",
        )
        titulos = {
            "colaborador_nome": "Colaborador",
            "nome_epi": "EPI Entregue",
            "numero_ca": "Nº CA",
            "data_entrega": "Data Entrega",
            "quantidade": "Qtd.",
            "data_proxima_troca": "Próxima Troca",
        }

        self.tree_epi = ttk.Treeview(
            lista_frame, columns=colunas, show="headings", style="Planna.Treeview"
        )

        for c in colunas:
            self.tree_epi.heading(c, text=titulos[c])
            largura = 200 if c in ("colaborador_nome", "nome_epi") else 110
            self.tree_epi.column(c, width=largura, anchor="w" if largura > 110 else "center")

        self.tree_epi.grid(row=0, column=0, sticky="nsew")

        scroll = ttk.Scrollbar(lista_frame, orient="vertical", command=self.tree_epi.yview)
        self.tree_epi.configure(yscrollcommand=scroll.set)
        scroll.grid(row=0, column=1, sticky="ns")

        self.tree_epi.bind("<<TreeviewSelect>>", self._on_select_epi)
        self.tree_epi.bind("<Double-1>", lambda e: self.carregar_epi_edicao())

        self.atualizar_lista_epi()

    def _on_select_epi(self, event=None):
        selecao = self.tree_epi.selection()
        self.epi_id_selecionado = (
            int(self.tree_epi.item(selecao[0], "tags")[0]) if selecao else None
        )

    def atualizar_lista_epi(self):
        for item in self.tree_epi.get_children():
            self.tree_epi.delete(item)
        for epi in self.db.listar_epis():
            self.tree_epi.insert(
                "",
                "end",
                values=(
                    epi["colaborador_nome"],
                    epi["nome_epi"],
                    epi["numero_ca"] or "",
                    epi["data_entrega"] or "",
                    epi["quantidade"] or "",
                    epi["data_proxima_troca"] or "",
                ),
                tags=(str(epi["id"]),),
            )

    def novo_epi(self):
        JanelaFormularioEPI(self, db=self.db, on_success=self._ao_salvar_registro)

    def carregar_epi_edicao(self):
        if not self.epi_id_selecionado:
            messagebox.showinfo("Selecione", "Selecione um registro de EPI para editar.")
            return
        JanelaFormularioEPI(
            self,
            db=self.db,
            epi_id=self.epi_id_selecionado,
            on_success=self._ao_salvar_registro,
        )

    def excluir_epi(self):
        if not self.epi_id_selecionado:
            messagebox.showinfo("Selecione", "Selecione um registro de EPI para excluir.")
            return
        if messagebox.askyesno("Confirmar", "Excluir este registro de EPI?"):
            self.db.excluir_epi(self.epi_id_selecionado)
            self.epi_id_selecionado = None
            self.atualizar_lista_epi()
            if self.on_change:
                self.on_change()

    # ==================================================================
    # SUB-ABA 2: EXAMES / ASO
    # ==================================================================
    def _montar_exames(self):
        frame = self.aba_exames
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)

        # Barra Superior de Ações
        topo_frame = ttk.Frame(frame, style="Fundo.TFrame")
        topo_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))

        ttk.Button(
            topo_frame,
            text="+ Registrar Exame / ASO",
            style="Primario.TButton",
            command=self.novo_exame,
        ).pack(side="left", padx=(0, 6))

        ttk.Button(
            topo_frame, text="Editar Selecionado", command=self.carregar_exame_edicao
        ).pack(side="left", padx=6)

        ttk.Button(
            topo_frame, text="Excluir", style="Perigo.TButton", command=self.excluir_exame
        ).pack(side="left", padx=6)

        # Tabela Full Screen
        lista_frame = ttk.Frame(frame, style="Fundo.TFrame")
        lista_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        lista_frame.columnconfigure(0, weight=1)
        lista_frame.rowconfigure(0, weight=1)

        colunas = (
            "colaborador_nome",
            "tipo_exame",
            "data_realizacao",
            "data_proximo_exame",
            "resultado",
        )
        titulos = {
            "colaborador_nome": "Colaborador",
            "tipo_exame": "Tipo de Exame",
            "data_realizacao": "Realizado em",
            "data_proximo_exame": "Próximo Exame",
            "resultado": "Resultado",
        }

        self.tree_exame = ttk.Treeview(
            lista_frame, columns=colunas, show="headings", style="Planna.Treeview"
        )

        for c in colunas:
            self.tree_exame.heading(c, text=titulos[c])
            largura = 200 if c in ("colaborador_nome", "tipo_exame") else 120
            self.tree_exame.column(c, width=largura, anchor="w" if largura > 120 else "center")

        self.tree_exame.grid(row=0, column=0, sticky="nsew")

        scroll = ttk.Scrollbar(lista_frame, orient="vertical", command=self.tree_exame.yview)
        self.tree_exame.configure(yscrollcommand=scroll.set)
        scroll.grid(row=0, column=1, sticky="ns")

        self.tree_exame.bind("<<TreeviewSelect>>", self._on_select_exame)
        self.tree_exame.bind("<Double-1>", lambda e: self.carregar_exame_edicao())

        self.atualizar_lista_exames()

    def _on_select_exame(self, event=None):
        selecao = self.tree_exame.selection()
        self.exame_id_selecionado = (
            int(self.tree_exame.item(selecao[0], "tags")[0]) if selecao else None
        )

    def atualizar_lista_exames(self):
        for item in self.tree_exame.get_children():
            self.tree_exame.delete(item)
        for ex in self.db.listar_exames():
            self.tree_exame.insert(
                "",
                "end",
                values=(
                    ex["colaborador_nome"],
                    ex["tipo_exame"],
                    ex["data_realizacao"] or "",
                    ex["data_proximo_exame"] or "",
                    ex["resultado"] or "",
                ),
                tags=(str(ex["id"]),),
            )

    def novo_exame(self):
        JanelaFormularioExame(self, db=self.db, on_success=self._ao_salvar_registro)

    def carregar_exame_edicao(self):
        if not self.exame_id_selecionado:
            messagebox.showinfo("Selecione", "Selecione um exame na lista para editar.")
            return
        JanelaFormularioExame(
            self,
            db=self.db,
            exame_id=self.exame_id_selecionado,
            on_success=self._ao_salvar_registro,
        )

    def excluir_exame(self):
        if not self.exame_id_selecionado:
            messagebox.showinfo("Selecione", "Selecione um exame na lista para excluir.")
            return
        if messagebox.askyesno("Confirmar", "Excluir este registro de exame?"):
            self.db.excluir_exame(self.exame_id_selecionado)
            self.exame_id_selecionado = None
            self.atualizar_lista_exames()
            if self.on_change:
                self.on_change()

    # ==================================================================
    # MÉTODOS AUXILIARES
    # ==================================================================
    def _ao_salvar_registro(self):
        self.atualizar_lista_epi()
        self.atualizar_lista_exames()
        if self.on_change:
            self.on_change()

    def atualizar_combos_colaboradores(self):
        pass

    def atualizar_tudo(self):
        self.atualizar_lista_epi()
        self.atualizar_lista_exames()