# -*- coding: utf-8 -*-
"""
Paleta de cores e constantes visuais do tema PLANNA Asfalto e Empreendimentos.
"""

# Cores principais da identidade PLANNA
VERMELHO = "#D31221"        # Cor principal / botões de ação
VERMELHO_HOVER = "#A50E1A"  # Estado hover de botões
CINZA_ESCURO = "#333333"    # Cabeçalhos e estrutura principal
CINZA_MEDIO = "#4A4A4A"
AMARELO = "#FFD100"         # Alertas, faixas e destaques
FUNDO = "#F4F4F4"           # Fundo geral da aplicação
BRANCO = "#FFFFFF"          # Cards, formulários e tabelas
TEXTO_CLARO = "#FFFFFF"
TEXTO_ESCURO = "#222222"
BORDA = "#D9D9D9"
VERDE_OK = "#2E7D32"        # Status em dia / Ok
VERMELHO_ALERTA = "#C62828"  # Alertas e pendências vencidas

# Destaque de linhas nas tabelas, baseados no status do colaborador
COR_LINHA_ATIVO = "#FFFFFF"      # Fundo branco para status ativo
COR_LINHA_AFASTADO = "#FFF6D6"   # Amarelo claro para afastados
COR_LINHA_DESLIGADO = "#E9E9E9"  # Cinza claro para inativos/desligados

# Indicação de erro visual para campos com validação pendente/inválida
COR_CAMPO_INVALIDO_BG = "#FDE2E2"
COR_CAMPO_INVALIDO_BORDA = "#C62828"

# Fontes padrão do sistema
FONTE_PADRAO = ("Segoe UI", 10)
FONTE_TITULO = ("Segoe UI", 14, "bold")
FONTE_CABECALHO = ("Segoe UI", 11, "bold")

# Opções para menus suspensos (Comboboxes)
STATUS_COLABORADOR = ["Ativo", "Afastado", "Desligado"]
TIPOS_CONTRATO = ["CLT", "Experiência", "PJ", "Estágio", "Temporário", "Aprendiz"]
TIPOS_EXAME = ["Admissional", "Periódico", "Demissional", "Mudança de Risco", "Retorno ao Trabalho"]
RESULTADOS_EXAME = ["Apto", "Inapto"]
TIPOS_OCORRENCIA = [
    "Falta Justificada",
    "Falta Injustificada",
    "Atraso",
    "Advertência Verbal",
    "Advertência Escrita",
    "Suspensão",
    "Elogio",
]

# Regras de Prazos e Notificações da Central de Pendências
MARCOS_EXPERIENCIA = [30, 45, 90]  # Prazos do contrato de experiência (em dias)
AVISO_EXPERIENCIA_DIAS = 10        # Antecedência de aviso para fim de experiência (em dias)
AVISO_EXAME_DIAS = 30              # Janela de alerta para exames vincendos (em dias)
AVISO_EPI_DIAS = 30                # Janela de alerta para troca de EPIs (em dias)