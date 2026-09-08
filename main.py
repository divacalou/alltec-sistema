# -*- coding: utf-8 -*-
"""
Sistema de Gestão Local de Funcionários & SST - PLANNA Asfalto e Empreendimentos
---------------------------------------------------------------------------------
Aplicação desktop 100% local (offline), com banco de dados SQLite gravado no
mesmo diretório do programa (planna_dados.db).

Como executar:
    python main.py

Como gerar o executável (.exe) para Windows:
    pip install pyinstaller
    pyinstaller --onefile --windowed --name PlannaGestao --add-data "assets;assets" main.py
    (o executável final aparece na pasta dist/)

Requer apenas a biblioteca padrão do Python (tkinter, sqlite3) e, opcionalmente,
Pillow (PIL) para exibir o logotipo em alta qualidade no cabeçalho.
"""
import os
import sys
import tkinter as tk
from tkinter import ttk

import theme
from backend.database import Database

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tabs.colaboradores import ColaboradoresTab
from tabs.sst import SSTTab
from tabs.ocorrencias import OcorrenciasTab
from tabs.pendencias import PendenciasTab

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo_planna.png")

# ----------------------------------------------------------------------
# Visual moderno opcional: se o pacote 'ttkbootstrap' estiver instalado,
# ele é usado como base da janela (widgets ttk continuam funcionando
# normalmente, apenas com um tema mais moderno por baixo). Se não estiver
# instalado, o sistema roda com o tema nativo 'clam' do Tkinter, já
# customizado com as cores da PLANNA em _configurar_estilos().
#   pip install ttkbootstrap   (opcional, requer internet)
# ----------------------------------------------------------------------
try:
    import ttkbootstrap as tb

    JANELA_BASE = tb.Window
    TTKBOOTSTRAP_DISPONIVEL = True
except ImportError:
    tb = None
    JANELA_BASE = tk.Tk
    TTKBOOTSTRAP_DISPONIVEL = False


class PlannaApp(JANELA_BASE):
    def __init__(self):
        if TTKBOOTSTRAP_DISPONIVEL:
            # 'flatly' é um tema claro e moderno; as cores da marca PLANNA
            # são reaplicadas em seguida por cima dele em _configurar_estilos().
            super().__init__(title="PLANNA - Gestão de Funcionários & SST", themename="flatly")
        else:
            super().__init__()
            self.title("PLANNA - Gestão de Funcionários & SST")
        self.geometry("1280x780")
        self.minsize(1024, 650)
        self.configure(bg=theme.FUNDO)

        self.db = Database()

        self._configurar_estilos()
        self._montar_cabecalho()
        self._montar_notebook()

        self.protocol("WM_DELETE_WINDOW", self._ao_fechar)

    # ----------------------------------------------------------------------
    def _configurar_estilos(self):
        # Tenta usar o ttkbootstrap quando disponível
        try:
            from ttkbootstrap import Style as BootstrapStyle

            style = BootstrapStyle(theme="flatly")
        except ImportError:
            style = ttk.Style(self)
            try:
                style.theme_use("clam")
            except tk.TclError:
                pass

        # Usamos self.app_style em vez de self.style para evitar conflito com o ttkbootstrap
        self.app_style = style

        style.configure("Fundo.TFrame", background=theme.FUNDO)
        style.configure("Card.TFrame", background=theme.BRANCO)
        style.configure(
            "Card.TLabelframe", background=theme.BRANCO, foreground=theme.CINZA_ESCURO,
            bordercolor=theme.BORDA, relief="solid",
        )
        style.configure(
            "Card.TLabelframe.Label", background=theme.BRANCO, foreground=theme.CINZA_ESCURO,
            font=theme.FONTE_CABECALHO,
        )
        style.configure("Titulo.TLabel", background=theme.FUNDO, foreground=theme.CINZA_ESCURO,
                        font=theme.FONTE_TITULO)
        style.configure("Subtitulo.TLabel", background=theme.BRANCO, foreground=theme.VERMELHO,
                        font=theme.FONTE_CABECALHO)
        style.configure("Campo.TLabel", background=theme.BRANCO, foreground=theme.CINZA_ESCURO,
                        font=theme.FONTE_PADRAO)

        style.configure("TNotebook", background=theme.FUNDO, borderwidth=0)
        style.configure(
            "TNotebook.Tab", background=theme.CINZA_ESCURO, foreground=theme.TEXTO_CLARO,
            font=theme.FONTE_CABECALHO, padding=(16, 8),
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", theme.VERMELHO)],
            foreground=[("selected", theme.TEXTO_CLARO)],
        )

        style.configure(
            "Primario.TButton", background=theme.VERMELHO, foreground=theme.TEXTO_CLARO,
            font=theme.FONTE_CABECALHO, padding=(10, 6), borderwidth=0,
        )
        style.map("Primario.TButton", background=[("active", theme.VERMELHO_HOVER)])

        style.configure(
            "Perigo.TButton", background=theme.CINZA_ESCURO, foreground=theme.TEXTO_CLARO,
            font=theme.FONTE_PADRAO, padding=(10, 6), borderwidth=0,
        )
        style.map("Perigo.TButton", background=[("active", "#1F1F1F")])

        style.configure("TButton", padding=(10, 6), font=theme.FONTE_PADRAO)

        style.configure(
            "Planna.Treeview", background=theme.BRANCO, fieldbackground=theme.BRANCO,
            foreground=theme.TEXTO_ESCURO, rowheight=26, font=theme.FONTE_PADRAO,
        )
        style.configure(
            "Planna.Treeview.Heading", background=theme.CINZA_ESCURO, foreground=theme.TEXTO_CLARO,
            font=theme.FONTE_CABECALHO,
        )
        style.map("Planna.Treeview", background=[("selected", theme.AMARELO)],
                  foreground=[("selected", theme.TEXTO_ESCURO)])

        style.configure(
            "Invalido.TEntry",
            fieldbackground=theme.COR_CAMPO_INVALIDO_BG,
            bordercolor=theme.COR_CAMPO_INVALIDO_BORDA,
            foreground=theme.TEXTO_ESCURO,
        )

    # ------------------------------------------------------------------
    def _montar_cabecalho(self):
        cabecalho = tk.Frame(self, bg=theme.CINZA_ESCURO, height=78)
        cabecalho.pack(fill="x", side="top")
        cabecalho.pack_propagate(False)

        faixa = tk.Frame(cabecalho, bg=theme.AMARELO, height=4)
        faixa.pack(fill="x", side="bottom")

        self._logo_img = None
        if os.path.exists(LOGO_PATH):
            try:
                from PIL import Image, ImageTk

                img = Image.open(LOGO_PATH)
                proporcao = 60 / img.height
                img = img.resize((max(1, int(img.width * proporcao)), 60))
                self._logo_img = ImageTk.PhotoImage(img)
            except Exception:
                try:
                    self._logo_img = tk.PhotoImage(file=LOGO_PATH)
                except Exception:
                    self._logo_img = None

        if self._logo_img is not None:
            tk.Label(cabecalho, image=self._logo_img, bg=theme.CINZA_ESCURO).pack(
                side="left", padx=16, pady=8
            )
        tk.Label(
            cabecalho,
            text="Gestão de Funcionários & SST",
            bg=theme.CINZA_ESCURO,
            fg=theme.TEXTO_CLARO,
            font=("Segoe UI", 16, "bold"),
        ).pack(side="left", padx=8)

        self.label_data = tk.Label(
            cabecalho, bg=theme.CINZA_ESCURO, fg=theme.AMARELO, font=theme.FONTE_CABECALHO,
        )
        self.label_data.pack(side="right", padx=20)
        self._atualizar_relogio()

    def _atualizar_relogio(self):
        from datetime import datetime

        self.label_data.configure(text=datetime.now().strftime("%d/%m/%Y - %H:%M"))
        self.after(30000, self._atualizar_relogio)

    # ------------------------------------------------------------------
    def _montar_notebook(self):
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True)

        self.aba_colaboradores = ColaboradoresTab(
            self.notebook, self.db, on_change=self._on_dados_alterados
        )
        self.aba_sst = SSTTab(self.notebook, self.db, on_change=self._on_dados_alterados)
        self.aba_ocorrencias = OcorrenciasTab(
            self.notebook, self.db, on_change=self._on_dados_alterados
        )
        self.aba_pendencias = PendenciasTab(self.notebook, self.db)

        self.notebook.add(self.aba_colaboradores, text="  Colaboradores  ")
        self.notebook.add(self.aba_sst, text="  SST & Medicina Ocupacional  ")
        self.notebook.add(self.aba_ocorrencias, text="  Ocorrências  ")
        self.notebook.add(self.aba_pendencias, text="  ⚠ Central de Pendências  ")

        self.notebook.bind("<<NotebookTabChanged>>", self._ao_trocar_aba)

    def _ao_trocar_aba(self, event=None):
        aba_atual = self.notebook.select()
        widget = self.notebook.nametowidget(aba_atual)
        if widget is self.aba_pendencias:
            self.aba_pendencias.atualizar()
        elif widget is self.aba_sst:
            self.aba_sst.atualizar_combos_colaboradores()
        elif widget is self.aba_ocorrencias:
            self.aba_ocorrencias.atualizar_combos_colaboradores()

    def _on_dados_alterados(self):
        """Chamado sempre que colaboradores/EPIs/exames/ocorrências mudam,
        para manter listas e combos sincronizados entre as abas."""
        self.aba_colaboradores.atualizar_lista()
        self.aba_sst.atualizar_tudo()
        self.aba_ocorrencias.atualizar_combos_colaboradores()
        self.aba_ocorrencias.atualizar_lista()
        self.aba_pendencias.atualizar()

    # ------------------------------------------------------------------
    def _ao_fechar(self):
        self.db.fechar()
        self.destroy()


def main():
    app = PlannaApp()
    app.mainloop()


if __name__ == "__main__":
    main()