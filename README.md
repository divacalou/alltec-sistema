# PLANNA – Gestão Local de Funcionários & SST

Aplicação web desacoplada com backend em Python (FastAPI), frontend reativo em React (Vite + Tailwind CSS) e banco SQLite local (planna_dados.db).

---

## Estrutura de Pastas

planna_sistema/
├── BACKEND/
│   ├── main.py
│   └── planna_dados.db
└── FRONTEND/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js

---

## Como Executar

1. Backend (Terminal 1)

cd BACKEND
python -m uvicorn main:app --reload --port 8000

* API: http://localhost:8000/api
* Docs: http://localhost:8000/docs

2. Frontend (Terminal 2)

cd FRONTEND
npm install
npm run dev

* App Web: http://localhost:5173

---

## Funcionalidades

* Colaboradores: Cadastro, edição, demissão e gestão de motoristas (CNH e veículos).
* Setores: Cadastro e organização por departamentos.
* EPIs: Controle de estoque com baixa automática na entrega.
* PCMSO / ASO: Registro e controle de vencimento de exames.
* Pendências: Alertas automáticos para exames a vencer e estoque baixo.

---
