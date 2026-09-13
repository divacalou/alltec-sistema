# 🚀 PLANNA RH & SST — Gestão de Pessoas e Segurança do Trabalho

> **Projeto em Desenvolvimento**

Aplicação web desacoplada para gestão de Recursos Humanos e SST com backend em **FastAPI**, frontend reativo em **React (Vite + Tailwind CSS)** usando a nova identidade visual **Slate/Rose**, e banco de dados **SQLite** local.

---

## 💻 Como Executar

### 1️⃣ Backend (FastAPI)
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```
- **API Base:** `http://localhost:8000/api` | **Docs:** `http://localhost:8000/docs`

### 2️⃣ Frontend (React)
```powershell
cd frontend
npm install
npm run dev
```
- **App Web:** `http://localhost:5173`

---

## 📌 Funcionalidades

* **Dashboard:** KPIs em tempo real e gráficos por setor.
* **Colaboradores:** Gestão de cadastros, cargos, setores e CNH.
* **EPIs & Estoque:** Controle de movimentação, CA e baixa automática.
* **PCMSO / ASOs:** Controle de exames por função e Matriz PGR.
* **Ocorrências / SST:** Registro de incidentes com severidade e status (Pendente/Resolvido).
* **Central de Pendências:** Alertas automáticos de exames a vencer e estoque crítico.
* **Relatórios & Configurações:** Emissão de dados operacionais e parâmetros globais.