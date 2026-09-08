# -*- coding: utf-8 -*-
"""Aba 4: Central de Pendências (Painel de Alertas Visual)."""
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import ttk

import theme
from backend.database import parse_data, hoje_str, DATE_FMT


class PendenciasTab(ttk.Frame):
    def __init__(self, parent, db):
        super().__init__(parent, style="Fundo.TFrame")
        self.db = db
        self._montar_layout()

    def _montar_layout(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

        # ---------------- 1. Cabeçalho Principal ----------------
        topo = ttk.Frame(self, style="Fundo.TFrame")
        topo.grid(row=0, column=0, sticky="ew", padx=15, pady=(15, 10))

        ttk.Label(topo, text="Central de Pendências e Alertas", style="Titulo.TLabel").pack(side="left")

        ttk.Button(
            topo,
            text="🔄 Atualizar Agora",
            style="Primario.TButton",
            command=self.atualizar
        ).pack(side="right")

        # ---------------- 2. Container de Conteúdo ----------------
        container = ttk.Frame(self, style="Fundo.TFrame")
        container.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0, 15))
        container.columnconfigure(0, weight=1)
        container.rowconfigure(0, weight=1)
        container.rowconfigure(1, weight=1)
        container.rowconfigure(2, weight=1)

        # Três seções estilizadas no padrão Dashboard
        self.bloco_experiencia, self.lbl_count_exp = self._criar_bloco_alerta(
            container,
            titulo="⏳ Contratos de Experiência (Próximos do Vencimento)",
            colunas=("colaborador", "admissao", "dias_corridos", "marco", "data_marco"),
            titulos={
                "colaborador": "Colaborador",
                "admissao": "Admissão",
                "dias_corridos": "Dias Decorridos",
                "marco": "Prazo / Restante",
                "data_marco": "Data Limite"
            },
            linha=0
        )

        self.bloco_exames, self.lbl_count_exames = self._criar_bloco_alerta(
            container,
            titulo="🩺 Exames Ocupacionais (Vencidos ou a Vencer em 30 Dias)",
            colunas=("colaborador", "tipo_exame", "proximo_exame", "situacao"),
            titulos={
                "colaborador": "Colaborador",
                "tipo_exame": "Exame",
                "proximo_exame": "Data Prevista",
                "situacao": "Status / Situação"
            },
            linha=1
        )

        self.bloco_epis, self.lbl_count_epis = self._criar_bloco_alerta(
            container,
            titulo="🥾 EPIs para Substituição / Troca (30 Dias)",
            colunas=("colaborador", "epi", "proxima_troca", "situacao"),
            titulos={
                "colaborador": "Colaborador",
                "epi": "Equipamento (EPI)",
                "proxima_troca": "Data de Troca",
                "situacao": "Status / Situação"
            },
            linha=2
        )

        self.atualizar()

    def _criar_bloco_alerta(self, parent, titulo, colunas, titulos, linha):
        frame = ttk.LabelFrame(parent, text=f" {titulo} ", style="Card.TLabelframe")
        frame.grid(row=linha, column=0, sticky="nsew", pady=6)
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(0, weight=1)

        # Tabela expansível
        tree = ttk.Treeview(
            frame,
            columns=colunas,
            show="headings",
            style="Planna.Treeview",
            height=4
        )

        for c in colunas:
            tree.heading(c, text=titulos[c])
            largura = 220 if c == "colaborador" else 130
            anchor = "w" if c in ("colaborador", "tipo_exame", "epi") else "center"
            tree.column(c, width=largura, anchor=anchor)

        tree.grid(row=0, column=0, sticky="nsew", padx=8, pady=8)

        scroll = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=scroll.set)
        scroll.grid(row=0, column=1, sticky="ns", pady=8)

        # Contador no canto do Card
        lbl_count = ttk.Label(frame, text="0 pendências", style="Campo.TLabel")
        lbl_count.grid(row=1, column=0, sticky="e", padx=8, pady=(0, 4))

        return tree, lbl_count

    # ------------------------------------------------------------------
    def atualizar(self):
        self._atualizar_experiencia()
        self._atualizar_exames()
        self._atualizar_epis()

    def _limpar(self, tree):
        for item in tree.get_children():
            tree.delete(item)

    def _atualizar_experiencia(self):
        self._limpar(self.bloco_experiencia)
        hoje = datetime.now()
        total = 0

        for col in self.db.listar_colaboradores():
            if (col["tipo_contrato"] or "").strip().lower() != "experiência":
                continue
            if (col["status"] or "").strip().lower() != "ativo":
                continue

            admissao = parse_data(col["data_admissao"])
            if not admissao:
                continue

            dias_corridos = (hoje - admissao).days

            for marco in theme.MARCOS_EXPERIENCIA:
                dias_restantes = marco - dias_corridos
                if 0 <= dias_restantes <= theme.AVISO_EXPERIENCIA_DIAS:
                    data_marco = admissao + timedelta(days=marco)
                    tag = "urgente" if dias_restantes <= 3 else "alerta"

                    self.bloco_experiencia.insert(
                        "", "end",
                        values=(
                            col["nome"],
                            col["data_admissao"],
                            f"{dias_corridos} dias",
                            f"{marco} dias (faltam {dias_restantes}d)",
                            data_marco.strftime(DATE_FMT),
                        ),
                        tags=(tag,),
                    )
                    total += 1

        self.lbl_count_exp.configure(text=f"Total: {total} alerta(s)")
        self.bloco_experiencia.tag_configure("urgente", background="#FDE2E2") # Vermelho suave
        self.bloco_experiencia.tag_configure("alerta", background="#FFF6D6")  # Amarelo suave

    def _atualizar_exames(self):
        self._limpar(self.bloco_exames)
        hoje = datetime.now()
        total = 0

        for ex in self.db.listar_exames():
            proximo = parse_data(ex["data_proximo_exame"])
            if not proximo:
                continue

            dias_restantes = (proximo - hoje).days
            if dias_restantes <= theme.AVISO_EXAME_DIAS:
                situacao = "🚨 VENCIDO" if dias_restantes < 0 else f"⚠️ Faltam {dias_restantes} dia(s)"
                tag = "urgente" if dias_restantes < 0 else "alerta"

                self.bloco_exames.insert(
                    "", "end",
                    values=(
                        ex["colaborador_nome"],
                        ex["tipo_exame"],
                        ex["data_proximo_exame"],
                        situacao
                    ),
                    tags=(tag,),
                )
                total += 1

        self.lbl_count_exames.configure(text=f"Total: {total} pendência(s)")
        self.bloco_exames.tag_configure("urgente", background="#FDE2E2")
        self.bloco_exames.tag_configure("alerta", background="#FFF6D6")

    def _atualizar_epis(self):
        self._limpar(self.bloco_epis)
        hoje = datetime.now()
        total = 0

        for epi in self.db.listar_epis():
            proxima = parse_data(epi["data_proxima_troca"])
            if not proxima:
                continue

            dias_restantes = (proxima - hoje).days
            if dias_restantes <= theme.AVISO_EPI_DIAS:
                situacao = "🚨 VENCIDO" if dias_restantes < 0 else f"⚠️ Faltam {dias_restantes} dia(s)"
                tag = "urgente" if dias_restantes < 0 else "alerta"

                self.bloco_epis.insert(
                    "", "end",
                    values=(
                        epi["colaborador_nome"],
                        epi["nome_epi"],
                        epi["data_proxima_troca"],
                        situacao
                    ),
                    tags=(tag,),
                )
                total += 1

        self.lbl_count_epis.configure(text=f"Total: {total} troca(s)")
        self.bloco_epis.tag_configure("urgente", background="#FDE2E2")
        self.bloco_epis.tag_configure("alerta", background="#FFF6D6")