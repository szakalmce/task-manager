# Task Manager - MVP

Prosta aplikacja webowa do zarządzania zadaniami z pliku `codzienne-działania.md`.

## Funkcje

- ✅ Wyświetlanie wszystkich zadań z pliku markdown
- ✅ Zaznaczanie/odznaczanie checkbox
- ✅ Automatyczna synchronizacja co 3 sekundy
- ✅ Zmiany zapisują się bezpośrednio do pliku

## Instalacja

```bash
cd /Users/tomasz_garbarz/2026/task-manager
npm install
```

## Uruchomienie

```bash
npm start
```

Aplikacja uruchomi się na: http://localhost:3000

## Użycie

1. Otwórz przeglądarkę i wejdź na http://localhost:3000
2. Zobaczysz wszystkie swoje zadania z pliku `codzienne-działania.md`
3. Kliknij checkbox aby oznaczyć zadanie jako wykonane
4. Zmiany automatycznie zapisują się do pliku
5. Aplikacja odświeża dane co 3 sekundy

## Struktura

- `server.js` - Backend (Express)
- `app.js` - Frontend (parser + renderer)
- `index.html` - Struktura HTML
- `styles.css` - Stylowanie
- `package.json` - Zależności

## Wymagania

- Node.js (wersja 14 lub nowsza)
- npm
