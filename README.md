# PLANNA – Gestão Local de Funcionários & SST

Aplicação desktop **100% local/offline**, com banco de dados **SQLite**
(`planna_dados.db`) gravado na mesma pasta do programa. Não depende de
internet nem de servidor.

## Estrutura de pastas

```
planna_sistema/
├── main.py                # Ponto de entrada (execute este arquivo)
├── database.py             # Acesso ao banco SQLite (schema + consultas)
├── theme.py                # Cores e constantes visuais do tema PLANNA
├── tabs/
│   ├── colaboradores.py    # Aba 1 – Cadastro & Consulta
│   ├── sst.py               # Aba 2 – EPIs + PCMSO/ASO
│   ├── ocorrencias.py       # Aba 3 – Histórico de Ocorrências
│   └── pendencias.py        # Aba 4 – Central de Pendências
├── assets/
│   └── logo_planna.png      # Logotipo exibido no cabeçalho
├── requirements.txt
└── build_exe.bat            # Script para gerar o .exe no Windows
```

## Como executar (modo desenvolvimento)

Requer apenas **Python 3.9+** (o Windows já traz `tkinter` embutido no
instalador padrão de python.org, não precisa instalar nada extra para rodar).

```bash
cd planna_sistema
python main.py
```

Na primeira execução o arquivo `planna_dados.db` será criado automaticamente
na mesma pasta.

### Dependência opcional (visual do logo)

Se o pacote `Pillow` estiver instalado, o logotipo é exibido com melhor
qualidade (redimensionado). Sem o Pillow o sistema funciona normalmente
(tenta carregar o PNG do jeito nativo do Tkinter; se falhar, o cabeçalho
segue apenas com o texto).

```bash
pip install -r requirements.txt
```

## Como gerar o executável (.exe) para Windows

1. Instale o PyInstaller (uma única vez, com internet disponível):
   ```bash
   pip install pyinstaller
   ```
2. Na pasta `planna_sistema`, rode o script pronto:
   ```bash
   build_exe.bat
   ```
   ou manualmente:
   ```bash
   pyinstaller --onefile --windowed --name PlannaGestao ^
       --add-data "assets;assets" main.py
   ```
3. O executável final aparece em `dist\PlannaGestao.exe`.
4. Copie `PlannaGestao.exe` para a pasta onde o sistema vai rodar
   (o banco `planna_dados.db` será criado ao lado do .exe na primeira
   execução).

> **Importante sobre backups:** como tudo fica em `planna_dados.db`, basta
> copiar esse único arquivo (com o programa fechado) para fazer backup ou
> restaurar os dados em outro computador.

## Funcionalidades

### Aba 1 – Colaboradores
Cadastro completo (dados pessoais e contratuais), busca por nome/matrícula/
CPF, edição, exclusão (em cascata: remove também EPIs, exames e ocorrências
vinculados) e listagem com status (Ativo / Afastado / Desligado).

### Aba 2 – SST & Medicina Ocupacional
- **Fichas de EPIs**: registro de entrega por colaborador (EPI, CA,
  quantidade, data de entrega e validade), com cálculo automático da
  **data da próxima troca**.
- **PCMSO & ASO**: registro de exames ocupacionais (Admissional, Periódico,
  Demissional, Mudança de Risco, Retorno ao Trabalho), com cálculo
  automático da **data do próximo exame** a partir da periodicidade em
  meses, e resultado (Apto/Inapto).

### Aba 3 – Ocorrências
Registro de faltas, atrasos, advertências, suspensões e elogios, com
histórico completo filtrável por colaborador.

### Aba 4 – Central de Pendências
Painel de alertas, atualizado automaticamente ao abrir a aba (ou pelo botão
"Atualizar Agora"):
1. **Contratos de experiência** próximos dos marcos de 30/45/90 dias
   (aviso quando faltam 10 dias ou menos para o marco).
2. **Exames (ASO) vencidos ou a vencer** nos próximos 30 dias.
3. **EPIs para substituição** com prazo vencido ou a vencer em 30 dias.

Linhas em **vermelho claro** = já vencido / prazo estourado.
Linhas em **amarelo claro** = vencendo em breve.

## Changelog – Correções e melhorias (2ª versão)

**Bugs corrigidos:**
- **Salvamento com CPF/matrícula em branco**: strings vazias eram gravadas
  como `''` (não `NULL`), e o SQLite trata múltiplas strings `''` como
  iguais para fins de restrição `UNIQUE` — por isso um segundo colaborador
  sem CPF/matrícula preenchido falhava silenciosamente. Agora campos vazios
  são convertidos para `NULL` antes de gravar (`database.py`,
  `_vazio_para_none`), e o SQLite permite múltiplos `NULL` distintos.
- **CPF/matrícula duplicados**: há checagem *proativa* antes de salvar
  (`Database.cpf_existe` / `Database.matricula_existe`, ignorando o próprio
  registro em edição) exibindo um `messagebox.showwarning` claro. Como
  segunda camada de proteção, `Database.salvar_colaborador` também captura
  `sqlite3.IntegrityError` e relança como `ValidacaoError` com mensagem
  amigável, tratada na interface.

**Fluxo de edição:**
- Duplo clique em qualquer linha da tabela carrega o colaborador no
  formulário automaticamente (além do botão "Editar Selecionado").
- O botão "Salvar Novo Colaborador" muda o texto para **"Atualizar
  Registro"** enquanto um colaborador está em edição (e um aviso
  "✏ Editando: Fulano" aparece abaixo do formulário); `salvar()` decide
  entre `INSERT` e `UPDATE` a partir de `colaborador_id_selecionado`.

**Máscaras de entrada em tempo real** (`utils/mascaras.py`,
classe `EntradaMascarada`):
- **CPF**: `000.000.000-00`
- **Telefone**: `(00) 00000-0000`
- **Datas** (nascimento, admissão, desligamento): `DD/MM/AAAA`, com
  validação em tempo real (`FocusOut`) que destaca o campo em vermelho
  claro (`Invalido.TEntry`) se a data não for real/possível; o salvamento é
  bloqueado com aviso enquanto houver data inválida.
- **Salário Base**: formatação dinâmica como moeda (`R$ 2.500,00`); o valor
  numérico usado no banco é extraído com `EntradaMascarada.valor_numerico()`.

**Layout e UI/UX:**
- Formulário de colaborador reorganizado em **grade de 2 colunas**
  (label + campo | label + campo), eliminando a rolagem vertical longa.
- Tenta carregar **ttkbootstrap** (tema `flatly`, flat/moderno) na
  inicialização; se não estiver instalado, cai automaticamente para o tema
  nativo `ttk` "clam" com as cores da PLANNA — nenhuma quebra caso a
  biblioteca não esteja presente (`pip install ttkbootstrap` é opcional).
- Linhas da tabela de colaboradores destacadas por status:
  **Ativo** (branco), **Afastado** (amarelo bem claro), **Desligado**
  (cinza claro).
- Colunas da tabela alinhadas: **Matrícula**, **CPF** e **Status**
  centralizados; **Nome**, **Função**, **Setor** e **Contrato** alinhados à
  esquerda.

## Personalização

As cores, listas de opções (tipos de contrato, tipos de exame, tipos de
ocorrência) e os prazos de alerta (dias de antecedência) ficam centralizados
em `theme.py`, facilitando ajustes sem mexer no restante do código.
