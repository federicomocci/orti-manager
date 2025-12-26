# Orti Manager 🏠

App per la gestione di appartamenti vacanza.

## Funzionalità

- ✅ Calendario prenotazioni multi-appartamento
- ✅ Gestione dinamica appartamenti (aggiungi/rimuovi)
- ✅ Obiettivi mensili con prezzo suggerito
- ✅ Dashboard KPI (Revenue, ADR, RevPar, Occupazione)
- ✅ Split finanziario automatico (commissioni, cedolare, quote)
- ✅ Gestione pulizie automatica
- ✅ 100% mobile-friendly
- ✅ Dati salvati in localStorage

## Deploy su Vercel (5 minuti)

### Metodo 1: Da GitHub (consigliato)

1. Vai su [github.com](https://github.com) e crea un account se non ce l'hai
2. Clicca "New repository" → chiamalo `orti-manager`
3. Carica tutti i file di questa cartella nel repository
4. Vai su [vercel.com](https://vercel.com) e accedi con GitHub
5. Clicca "New Project" → seleziona `orti-manager`
6. Clicca "Deploy" → fatto!

### Metodo 2: Vercel CLI

```bash
npm install -g vercel
cd orti-manager-app
vercel
```

## Sviluppo locale

```bash
npm install
npm run dev
```

## Aggiornamenti futuri

Ogni modifica pushata su GitHub si deploya automaticamente su Vercel.

## Struttura

```
orti-manager-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Componente principale
│   ├── main.jsx         # Entry point
│   └── index.css        # Stili Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

## Prossime funzionalità (da implementare)

- [ ] Database cloud (Supabase) invece di localStorage
- [ ] Sync con Google Calendar
- [ ] Export PDF report mensili
- [ ] Notifiche WhatsApp/Telegram
- [ ] Multi-utente con login
