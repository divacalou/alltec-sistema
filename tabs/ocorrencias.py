# -*- coding: utf-8 -*-
"""Aba 3: Histórico de Ocorrências e Modal de Registro."""
import tkinter as tk
from tkinter import ttk, messagebox

import theme
from backend.database import hoje_str
from tabs.sst import ComboColaborador


class JanelaFormularioOcorrencia(tk.Toplevel):
    """Janela Modal para Cadastrar ou Editar Ocorrências."""

    def __init__(self, parent, db, ocorrencia_id=None, on_success=None):
        super().__init__(parent)
        self.db = db
        self.ocorrencia_id = ocorrencia_id
        self.on_success = on_success

        self.title("Editar Ocorrência" if ocorrencia_id else "Registrar Nova Ocorrência")
        self.geometry("480x420")
        self.resizable(False, False)
        self.grab_set()  # Torna a janela modal (bloqueia a tela de trás)

        self._montar_layout()
        if self.ocorrencia_id:
            self.carregar_dados()

    def _montar_layout(self):
        container = ttk.Frame(self, padding=20, style="Card.TFrame")
        container.pack(fill="both", expand=True)

        # Colaborador
        ttk.Label(container, text="Colaborador*", style="Campo.TLabel").grid(
            row=0, column=0, sticky="w", padx=4, pady=6
        )
        self.combo_colaborador = ComboColaborador(container, self.db)
        self.combo_colaborador.grid(row=0, column=1, sticky="ew", padx=4, pady=6)

        # Data
        ttk.Label(container, text="Data (dd/mm/aaaa)", style="Campo.TLabel").grid(
            row=1, column=0, sticky="w", padx=4, pady=6
        )
        self.var_data = tk.StringVar(value=hoje_str())
        ttk.Entry(container, textvariable=self.var_data, width=30).grid(
            row=1, column=1, sticky="w", padx=4, pady=6
        )

        # Tipo de Ocorrência
        ttk.Label(container, text="Tipo de Ocorrência", style="Campo.TLabel").grid(
            row=2, column=0, sticky="w", padx=4, pady=6
        )
        self.var_tipo = tk.StringVar(value=theme.TIPOS_OCORRENCIA[0])
        ttk.Combobox(
            container,
            textvariable=self.var_tipo,
            values=theme.TIPOS_OCORRENCIA,
            state="readonly",
            width=28,
        ).grid(row=2, column=1, sticky="w", padx=4, pady=6)

        # Descrição
        ttk.Label(container, text="Descrição", style="Campo.TLabel").grid(
            row=3, column=0, sticky="nw", padx=4, pady=6
        )
        self.texto_descricao = tk.Text(container, width=30, height=6, wrap="word")
        self.texto_descricao.grid(row=3, column=1, sticky="ew", padx=4, pady=6)

        container.columnconfigure(1, weight=1)

        # Botões de Ação no Rodapé
        botoes = ttk.Frame(container, style="Card.TFrame")
        botoes.grid(row=4, column=0, columnspan=2, sticky="e", pady=(20, 0))

        ttk.Button(botoes, text="Cancelar", command=self.destroy).pack(side="right", padx=6)
        ttk.Button(
            botoes, text="Salvar Ocorrência", style="Primario.TButton", command=self.salvar
        ).pack(side="right", padx=6)

    def salvar(self):
        colaborador_id = self.combo_colaborador.id_selecionado()
        if not colaborador_id:
            messagebox.showwarning("Campo obrigatório", "Selecione o colaborador.", parent=self)
            return

        dados = {
            "colaborador_id": colaborador_id,
            "data": self.var_data.get().strip() or hoje_str(),
            "tipo": self.var_tipo.get(),
            "descricao": self.texto_descricao.get("1.0", "end").strip(),
        }

        try:
            self.db.salvar_ocorrencia(dados, self.ocorrencia_id)
        except Exception as exc:
            messagebox.showerror("Erro ao salvar", f"Não foi possível salvar: {exc}", parent=self)
            return

        messagebox.showinfo("Sucesso", "Ocorrência gravada com sucesso!", parent=self)
        if self.on_success:
            self.on_success()
        self.destroy()

    def carregar_dados(self):
        registros = [
            o for o in self.db.listar_ocorrencias() if o["id"] == self.ocorrencia_id
        ]
        if not registros:
            return
        oc = registros[0]
        self.var_data.set(oc["data"] or "")
        self.var_tipo.set(oc["tipo"] or theme.TIPOS_OCORRENCIA[0])
        self.texto_descricao.delete("1.0", "end")
        self.texto_descricao.insert("1.0", oc["descricao"] or "")
        for rotulo, cid in self.combo_colaborador._mapa.items():
            if cid == oc["colaborador_id"]:
                self.combo_colaborador.var.set(rotulo)
                break


# ======================================================================
# ABA PRINCIPAL DE CONSULTA E LISTAGEM DE OCORRÊNCIAS
# ======================================================================
class OcorrenciasTab(ttk.Frame):
    def __init__(self, parent, db, on_change=None):
        super().__init__(parent, style="Fundo.TFrame")
        self.db = db
        self.on_change = on_change
        self.ocorrencia_id_selecionada = None
        self._montar_layout()

    def _montar_layout(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

        # ---------------- Barra Superior (Ações & Filtros) ----------------
        topo_frame = ttk.Frame(self, style="Fundo.TFrame")
        topo_frame.grid(row=0, column=0, sticky="ew", padx=15, pady=(15, 10))

        # Ações à Esquerda
        btn_frame = ttk.Frame(topo_frame, style="Fundo.TFrame")
        btn_frame.pack(side="left")

        ttk.Button(
            btn_frame,
            text="+ Nova Ocorrência",
            style="Primario.TButton",
            command=self.nova_ocorrencia,
        ).pack(side="left", padx=(0, 6))

        ttk.Button(
            btn_frame, text="Editar Selecionada", command=self.carregar_edicao
        ).pack(side="left", padx=6)

        ttk.Button(
            btn_frame, text="Excluir", style="Perigo.TButton", command=self.excluir
        ).pack(side="left", padx=6)

        # Filtro por Colaborador à Direita
        filtro_frame = ttk.Frame(topo_frame, style="Fundo.TFrame")
        filtro_frame.pack(side="right")

        ttk.Label(filtro_frame, text="Filtrar Colaborador:", style="Campo.TLabel").pack(
            side="left", padx=(0, 6)
        )
        self.combo_filtro = ComboColaborador(filtro_frame, self.db)
        self.combo_filtro.pack(side="left")

        ttk.Button(filtro_frame, text="Filtrar", command=self.atualizar_lista).pack(
            side="left", padx=6
        )
        ttk.Button(filtro_frame, text="Ver Todos", command=self._ver_todos).pack(
            side="left", padx=(0, 0)
        )

        # ---------------- Tabela Expansível (Full Screen) ----------------
        lista_frame = ttk.Frame(self, style="Fundo.TFrame")
        lista_frame.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0, 15))
        lista_frame.columnconfigure(0, weight=1)
        lista_frame.rowconfigure(0, weight=1)

        colunas = ("data", "colaborador_nome", "tipo", "descricao")
        titulos = {
            "data": "Data",
            "colaborador_nome": "Colaborador",
            "tipo": "Tipo de Ocorrência",
            "descricao": "Descrição / Observações",
        }

        self.tree = ttk.Treeview(
            lista_frame, columns=colunas, show="headings", style="Planna.Treeview"
        )

        self.tree.heading("data", text=titulos["data"])
        self.tree.column("data", width=100, anchor="center")

        self.tree.heading("colaborador_nome", text=titulos["colaborador_nome"])
        self.tree.column("colaborador_nome", width=220, anchor="w")

        self.tree.heading("tipo", text=titulos["tipo"])
        self.tree.column("tipo", width=180, anchor="w")

        self.tree.heading("descricao", text=titulos["descricao"])
        self.tree.column("descricao", width=400, anchor="w")

        self.tree.grid(row=0, column=0, sticky="nsew")

        scroll = ttk.Scrollbar(lista_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        scroll.grid(row=0, column=1, sticky="ns")

        self.tree.bind("<<TreeviewSelect>>", self._on_select)
        self.tree.bind("<Double-1>", self._on_double_click)

        self.atualizar_lista()

    # ------------------------------------------------------------------
    def _ver_todos(self):
        self.combo_filtro.var.set("")
        self.atualizar_lista()

    def _on_select(self, event=None):
        selecao = self.tree.selection()
        self.ocorrencia_id_selecionada = (
            int(self.tree.item(selecao[0], "tags")[0]) if selecao else None
        )

    def _on_double_click(self, event=None):
        self._on_select()
        self.carregar_edicao()

    def atualizar_lista(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        colaborador_id = self.combo_filtro.id_selecionado()
        for oc in self.db.listar_ocorrencias(colaborador_id):
            descricao = oc["descricao"] or ""
            resumo = descricao if len(descricao) <= 80 else descricao[:77] + "..."
            self.tree.insert(
                "",
                "end",
                values=(
                    oc["data"] or "",
                    oc["colaborador_nome"],
                    oc["tipo"] or "",
                    resumo,
                ),
                tags=(str(oc["id"]),),
            )

    def nova_ocorrencia(self):
        JanelaFormularioOcorrencia(self, db=self.db, on_success=self._ao_salvar_registro)

    def carregar_edicao(self):
        if not self.ocorrencia_id_selecionada:
            messagebox.showinfo("Selecione", "Selecione uma ocorrência na lista para editar.")
            return
        JanelaFormularioOcorrencia(
            self,
            db=self.db,
            ocorrencia_id=self.ocorrencia_id_selecionada,
            on_success=self._ao_salvar_registro,
        )

    def _ao_salvar_registro(self):
        self.atualizar_lista()
        if self.on_change:
            self.on_change()

    def excluir(self):
        if not self.ocorrencia_id_selecionada:
            messagebox.showinfo("Selecione", "Selecione uma ocorrência na lista para excluir.")
            return
        if messagebox.askyesno("Confirmar", "Tem certeza que deseja excluir esta ocorrência?"):
            self.db.excluir_ocorrencia(self.ocorrencia_id_selecionada)
            self.ocorrencia_id_selecionada = None
            self.atualizar_lista()
            if self.on_change:
                self.on_change()

    def atualizar_combos_colaboradores(self):
        self.combo_filtro.atualizar()