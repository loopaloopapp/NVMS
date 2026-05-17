# 🚀 NVMS - Next.js Metadata Visibility Scanner
### *Dual-Phase Technical SEO Auditor & Core Web Vitals Suite*

**NVMS** è una piattaforma di analisi e audit SEO tecnico professionale sviluppata in **Next.js**. Il suo obiettivo principale è rilevare e segnalare le pagine web in cui i tag metadata fondamentali (come `<title>`, `description`, `canonical`, `robots`, `Open Graph`, `Twitter Cards`) **non sono presenti nell'HTML iniziale (server-side)**, ma vengono caricati solo successivamente sul client tramite l'esecuzione di JavaScript. 

Questa situazione rappresenta un grave rischio per l'indicizzazione nei motori di ricerca, poiché i crawler (come Googlebot) potrebbero non elaborare correttamente o in tempo i contenuti iniettati esclusivamente via JS.

Inoltre, **NVMS** integra un pannello diagnostico completo in stile **Google PageSpeed Insights** che misura le performance del browser in tempo reale (Core Web Vitals) ed esegue audit tecnici per l'Accessibilità e le Best Practices.

---

## 🌟 Funzionalità Principali

### 🔍 1. Scanner di Visibilità a Doppia Fase (SSR vs CSR)
*   **Fase Server-Side**: Analizza il markup HTML grezzo restituito dal server simulando lo User-Agent ufficiale di `Googlebot/2.1`.
*   **Fase Client-Side**: Avvia un'istanza headless di **Playwright (Chromium)** per caricare ed eseguire completamente il codice JavaScript della pagina fino allo stato di `networkidle`.
*   **Diff Visualizer**: Mette a confronto i tag delle due fasi ed evidenzia le anomalie di idratazione (es. tag caricati solo in CSR).

### ⚡ 2. Suite PageSpeed & Core Web Vitals (Simulata & Reale)
Misura l'esperienza utente sulla pagina catturando metriche reali e simulate ricavate direttamente dalle API del browser (`window.performance`):
*   **Time to First Byte (TTFB)**: Velocità di risposta del server (Soglia: Ottimo < 200ms).
*   **First Contentful Paint (FCP)**: Tempo del primo rendering visivo dei contenuti (Soglia: Ottimo < 1s).
*   **DOM Interactive Time**: Il tempo impiegato dal DOM per diventare navigabile ed interattivo.
*   **Cumulative Layout Shift (CLS)**: Stabilità visiva del layout durante il rendering.

### 🎨 3. Quadranti Lighthouse & Checklist Interattive
*   **Lighthouse Circular Gauges**: Quattro bellissimi quadranti ad anello animati in CSS che indicano il punteggio (0-100) per: *Performance*, *Accessibilità*, *Best Practices* ed *SEO*.
*   **Passed & Failed Audits**: Una checklist interattiva ed espandibile che elenca tutti i controlli tecnici effettuati (es. presenza di un solo tag `H1`, viewport mobile corretto, presenza dell'attributo `lang` sul tag `html`).
*   **Pillole di Evidenziazione Dinamiche**: I pulsanti di ispezione del report cambiano colore autonomamente (Verde, Giallo o Rosso) in base al punteggio complessivo della pagina.

### 💾 4. Esportazione Dati Avanzata
Permette di esportare i report tecnici delle scansioni in un click in formato **CSV** o **JSON**.

---

## 🛠️ Architettura Tecnica

Il progetto è altamente modulare e strutturato in `/src`:

1.  **Crawler & Queue Management (`src/lib/crawler/`)**:
    *   `discovery.ts`: Scansiona il DOM iniziale con Cheerio per raccogliere ed estrarre i link interni utili al crawl automatico BFS.
2.  **Analysis Engine (`src/lib/analyzer/`)**:
    *   `fetchInitialHtml.ts`: Client HTTP per il recupero dell'HTML puro.
    *   `renderWithBrowser.ts`: Gestore headless Playwright con **sistema di salvaguardia try-catch**. Se i browser del server hanno problemi di dipendenze (es. ffmpeg obsoleto o vecchio OS), il sistema non va in crash e applica metriche protette autogestite.
3.  **Metadata Extraction (`src/lib/extractors/`)**:
    *   `headMetadata.ts`: Scraper del tag `<head>` per tracciare og, twitter, hreflang, robots, canonical e JSON-LD.
    *   `lighthouseAudits.ts`: Suite di calcolo euristico per assegnare i punteggi Lighthouse.
4.  **Risk Scoring Engine (`src/lib/scoring/`)**:
    *   `seoRiskScore.ts`: Calcola un indice di rischio da 0 (Perfetto) a 10+ (Critico) in base al peso dei tag mancanti all'avvio.

---

## 🚀 Installazione e Avvio Locale

Assicurati di avere installato **NodeJS >= 20** sul tuo sistema.

### 1. Clona il repository e installa le dipendenze
```bash
git clone https://github.com/loopaloopapp/NVMS.git
cd NVMS
npm install
```

### 2. Installa i browser headless di Playwright
Avvia l'installazione delle dipendenze di Chromium necessarie per l'analisi Playwright:
```bash
npx playwright install chromium
```

### 3. Avvia l'applicazione in modalità sviluppo
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000) sul tuo browser ed inizia a scansionare i siti!

---

## 🐳 Deploy Online e Dockerizzazione

Il progetto include un file [Dockerfile](file:///Users/lucaperini/Desktop/NMVS/Dockerfile) ottimizzato per il deploy cloud istantaneo. Questo file utilizza l'immagine ufficiale Microsoft Playwright pre-configurata con tutte le librerie Linux necessarie all'esecuzione di Chromium.

### Deploy su Railway (Consigliato per Scansione Reale)
1. Accedi a [Railway.app](https://railway.app/) tramite GitHub.
2. Crea un **New Project** ed importa questo repository.
3. Railway rileverà il `Dockerfile`, compilerà l'app Next.js ed esporrà il crawler funzionante online al 100%.

### Deploy su Vercel (Ottimo per presentazioni e Modalità Demo)
1. Accedi a [Vercel.com](https://vercel.com/) ed importa il repository.
2. Clicca su **Deploy**.
3. *Grazie al sistema di fallback, l'applicazione funzionerà in Vercel senza crash, abilitando la modalità Demo interattiva con grafici completi!*

---

## 📄 Licenza
Rilasciato sotto licenza MIT. Libero di essere modificato e integrato.
