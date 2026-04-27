# Paleographia

Application de transcription paléographique (OCR) et préparation audio, avec support multi-fournisseur IA (Gemini/GPT), configurables depuis l'interface.

## Prérequis

- Node.js 20+

## Installation

1. Installer les dépendances
   - `npm install`
2. Copier les variables d'environnement
   - copier `.env.example` vers `.env`

## Exécution

### Frontend uniquement (mode local)

1. Lancer Vite
   - `npm run dev`
2. Ouvrir Paramètres dans l'app
3. Choisir `Local` puis renseigner clé Gemini et/ou clé GPT

### Frontend + API preprod locale

1. Lancer l'API backend
   - `npm run server`
2. Lancer le frontend
   - `npm run dev`
3. Dans l'app, choisir `Preprod` dans Paramètres

## Paramètres dans l'app

- Bouton `Paramètres`: configure mode d'exécution, clés API, budgets tokens, stratégie de bascule.
- Bouton `Aide`: procédure guidée intégrée.
- Doc détaillée: `docs/configuration-parametres.md`.

## Scripts

- `npm run dev`: frontend Vite
- `npm run server`: API locale `/api/analyze` (mode preprod)
- `npm run build`: build production
- `npm run preview`: prévisualiser la build
- `npm run lint`: vérification TypeScript
