# PLANNA – Gestão Local de Funcionários & SST

Aplicação web **desacoplada**, com backend em **Python (FastAPI)**, frontend reativo em **React (Vite + Tailwind CSS)** e banco de dados **SQLite** (`planna_dados.db`) gravado na pasta do backend. 

---

## Estrutura de pastas
```
planna-sistema/
├── backend/
│   ├── main.py              # Aplicação FastAPI, rotas e conexão SQLite
│   └── planna_dados.db      # Banco de dados SQLite local
│
├── frontend/
│   ├── src/                 # Componentes React, views e estilos
│   ├── index.html           # Ponto de entrada do Vite
│   ├── package.json         # Scripts e dependências do Node.js
│   └── vite.config.js       # Configurações do Vite
│
├── utils/
│   └── mascaras.py          # Utilitários de formatação
│
└── .gitignore               # Arquivos ignorados pelo Git
```

## Como Executar

Requer **Python 3.9+** e **Node.js 18+**.

**1. Backend (Terminal 1):**
```bash
cd backend
python -m pip install fastapi uvicorn pydantic
python -m uvicorn main:app --reload --port 8000
```
> API: `http://127.0.0.1:8000` | Docs: `http://127.0.0.1:8000/docs`

**2. Frontend (Terminal 2):**
```bash
cd frontend
npm install
npm run dev
```
> App Web: `http://localhost:5173`

---

## Funcionalidades

* **Dashboard**: KPIs gerais de colaboradores, EPIs e exames com distribuição gráfica por setor.
* **Colaboradores**: Listagem com busca por nome/CPF/cargo, filtros por setor e cadastro integrado.
* **SST & Ocorrências**: Registro de faltas, advertências, EPIs e exames (ASO/PCMSO) com histórico dinâmico.
* **Backup Simples**: Basta copiar o arquivo `backend/planna_dados.db` com a API desligada.

---

## Migração Web

* **Nova Arquitetura**: Migração de Tkinter/Desktop para React + Tailwind CSS e API REST desacoplada em FastAPI.
* **Correções**: Resolução de erros de escopo no `main.py`, criação automática de tabelas e rotas de busca parametrizadas.
* **Portabilidade**: Configuração de repositório Git com `.gitignore` para desenvolvimento em home office via GitHub.