# Configuration: bouton Aide / Parametres

## Objectif

Ce document explique comment parametrer l'application directement depuis le bouton Parametres et comment utiliser le mode Aide integre.

## Ou ouvrir les reglages

1. Ouvrir l'application.
2. En bas de l'ecran, cliquer sur Parametres.
3. Utiliser l'onglet Aide pour consulter la procedure dans l'app.

## Parametrage des cles API

### Mode Local

- Selectionner Mode d'execution: Local.
- Renseigner Cle Gemini et/ou Cle GPT.
- Ces cles sont stockees dans localStorage du navigateur.
- Ce mode est adapte au test local rapide.

### Mode Preprod

- Selectionner Mode d'execution: Preprod.
- L'app envoie les requetes a /api/analyze.
- Les cles doivent etre configurees cote serveur:
  - GEMINI_API_KEY
  - OPENAI_API_KEY
- Aucune cle n'est necessaire dans le navigateur pour ce mode.

## Strategie Gemini / GPT

- Auto: l'app choisit le fournisseur avec le plus de tokens restants.
- Gemini prioritaire: essaie Gemini d'abord.
- GPT prioritaire: essaie GPT d'abord.
- Option Basculer automatiquement: tente l'autre fournisseur en cas d'echec ou de budget insuffisant.

## Budgets tokens

- Tokens restants Gemini et GPT sont editables manuellement.
- Seuil mini pour autoriser un appel: bloque un fournisseur si son budget est sous ce seuil.
- Apres une analyse, les tokens consommes sont deduits automatiquement.
- Si la metrique token API n'est pas disponible, l'app applique une estimation conservative.

## Commandes pour local + preprod

1. Installer dependances:
   - npm install
2. Lancer API preprod locale:
   - npm run server
3. Lancer frontend Vite:
   - npm run dev
4. Ouvrir l'app et choisir le mode Preprod dans Parametres.

## Variables d'environnement (.env)

- GEMINI_API_KEY
- OPENAI_API_KEY
- API_PROXY_TARGET (optionnel, defaut: http://localhost:8787)

## Debug Android (page blanche)

- Le navigateur Android peut ne pas supporter Web Speech API.
- L'app desactive alors le bouton audio pour eviter un crash runtime.
- La transcription reste fonctionnelle meme sans audio.
