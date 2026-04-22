---
description: Commit, verifica anonimato e push su GitHub
allowed-tools: Bash(git *), Bash(grep *), Read, Edit, Grep
---

## Contesto

- Branch corrente: !`git branch --show-current`
- Remote: !`git remote -v`
- Stato: !`git status --short`
- Config locale user.name: !`git config --local user.name`
- Config locale user.email: !`git config --local user.email`

## Il tuo compito

Esegui commit, aggiorna il README se necessario, verifica che tutto sia anonimo, e pusha su GitHub. Segui TUTTI i passi in ordine. NON saltare nessun passo. NON includere mai `Co-Authored-By` nei messaggi di commit.

---

## Passo 1: Commit

1. Controlla `git status` e `git diff --stat`.
2. Se non ci sono modifiche (ne staged ne unstaged ne untracked), comunica all'utente che non c'e nulla da pushare e **FERMATI**.
3. Analizza le modifiche nel dettaglio (`git diff` per i file modificati, contenuto dei file untracked).
4. Genera un messaggio di commit conciso e descrittivo in inglese. **MAI includere `Co-Authored-By`.**
5. Aggiungi i file rilevanti allo stage (`git add` dei file specifici, mai `git add -A` o `git add .`).
6. Esegui il commit.

---

## Passo 2: Aggiornamento README

1. Leggi il file `README.md` corrente.
2. Valuta se le modifiche appena committate richiedono un aggiornamento del README:
   - Nuove feature significative per l'utente finale
   - Cambiamenti nelle istruzioni d'uso o installazione
   - Nuove dipendenze importanti
   - Cambiamenti nella licenza o struttura del progetto
3. Se servono aggiornamenti: modifica il README.md, stage e crea un nuovo commit dedicato (es. "docs: update README").
4. Se non servono: prosegui senza fare nulla.

---

## Passo 3: Controllo anonimato

Questo e il passo PIU CRITICO. Esegui TUTTI i controlli seguenti. Se anche UNO solo fallisce, **FERMATI IMMEDIATAMENTE** e riporta il problema all'utente. **NON procedere al push.**

### 3a. Config git locale
Verifica che la config git LOCALE del repository sia corretta:
```
git config --local user.name
git config --local user.email
```
- `user.name` DEVE essere `presence_` (o un altro pseudonimo, ma MAI un nome reale)
- `user.email` DEVE essere vuota o un'email anonima (MAI un'email personale reale)
- Se non sono impostate localmente, la config globale verra usata nei commit — questo e un ERRORE. Segnala e fermati.

### 3b. Commit non pushati
Controlla tutti i commit non ancora presenti sul remote:
```
git log @{u}..HEAD --format="%H %an <%ae>"
```
Per OGNI commit, verifica che:
- Il campo Author Name NON contenga nomi reali (es. nomi, cognomi, username personali)
- Il campo Author Email NON contenga email personali (es. `@gmail.com`, `@hotmail.com`, `@outlook.com`, qualsiasi email con nome reale)

### 3c. Contenuto dei file tracked
Scansiona TUTTI i file tracked nel repository per stringhe sensibili:
```
git grep -i "<your_real_name>"
git grep -i "<your_real_surname>"
```
Verifica anche:
```
git grep -E "[a-zA-Z0-9._%+-]+@gmail\.com" -- ':!node_modules' ':!package-lock.json'
git grep -E "[a-zA-Z0-9._%+-]+@hotmail\.com" -- ':!node_modules' ':!package-lock.json'
git grep -E "[a-zA-Z0-9._%+-]+@outlook\.com" -- ':!node_modules' ':!package-lock.json'
```
Controlla anche `package.json` per campi `author`, `contributors`, `repository` che possano contenere info personali.

Se QUALSIASI controllo trova dati personali: **FERMATI**, elenca tutti i problemi trovati, e chiedi all'utente come procedere.

---

## Passo 4: Push

Solo se TUTTI i controlli del Passo 3 sono passati:

1. Esegui `git push origin <branch-corrente>`
2. Conferma all'utente:
   - Branch pushato
   - Numero di commit pushati
   - Che tutti i controlli di anonimato sono passati
