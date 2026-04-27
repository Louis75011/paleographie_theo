# CLAUDE.md

## 1) Objet de l'application

Paléographia est une application React/Vite orientée paléographie numérique.
Elle prend une image (photo de page), en extrait une transcription via Gemini, puis génère une version optimisée pour lecture vocale (TTS) avec une lecture audio navigateur.

## 2) Stack et environnement

- Frontend: React 19 + TypeScript + Vite 6
- UI: Tailwind CSS v4 (+ plugin typography), lucide-react, react-markdown
- IA: @google/genai (appel direct depuis le frontend)
- Audio: Web Speech API (window.speechSynthesis)
- Build/serve: Vite
- Variable critique: GEMINI_API_KEY injectee via Vite (`process.env.GEMINI_API_KEY`)

## 3) Structure du projet

- Entree: `src/main.tsx`
- Orchestrateur principal: `src/App.tsx`
- Prompt systeme Gemini: `src/constants.ts`
- Types: `src/types.ts`
- Style global/theme: `src/index.css`
- UI modulaire:
  - `src/components/Header.tsx`
  - `src/components/HeroSection.tsx`
  - `src/components/InputPanel.tsx`
  - `src/components/TranscriptionPanel.tsx`
  - `src/components/AudioPanel.tsx`
  - `src/components/FooterControls.tsx`
- Metadonnees app: `metadata.json`
- SEO + meta social: `index.html`
- Build config: `vite.config.ts`, `tsconfig.json`

## 4) Flux fonctionnel (runtime)

1. Utilisateur importe une image depuis `InputPanel`.
2. `App.tsx` convertit le fichier en base64 (`FileReader`).
3. Appel Gemini (`models.generateContent`) avec:
   - modele `gemini-2.5-pro-preview-06-05`
   - `systemInstruction` depuis `SYSTEM_INSTRUCTION`
   - schema JSON force (`originalTranscript`, `audioOptimizedTranscript`)
4. Reponse parsee en JSON et affichee dans:
   - `TranscriptionPanel` (texte fidele)
   - `AudioPanel` (texte optimise oral)
5. Bouton "Ecouter" utilise `speechSynthesis` pour lire `audioOptimizedTranscript`.

## 5) Etat global et interactions

Etat principal dans `App.tsx`:

- `imageFile`, `imagePreviewUrl`
- `isProcessing`
- `result` (`AnalysisResult | null`)
- `error`
- `isPlaying`

Interactions clefs:

- Import image via bouton footer ou zone de drop/click.
- Lancement analyse desactive tant qu'aucun fichier n'est charge.
- Lecture audio activable seulement si resultat present.
- Nettoyage synthese vocale en unmount (`speechSynthesis.cancel`).

## 6) UX/UI et accessibilite

Points positifs:

- Interface claire en 3 panneaux (Input / Transcription / Audio).
- Theme coherent "archive/papier".
- `aria-label`, `aria-live`, `aria-busy`, `role=toolbar` presents.
- Etats vides et chargement explicites.

Points d'attention:

- Le "glisser-deposer" n'est pas implemente techniquement (zone cliquable seulement).
- `overflow: hidden` global sur `body` peut limiter certains cas d'accessibilite/navigation.
- Le chargement des voix TTS depend du navigateur; comportement variable selon plate-forme.

## 7) Securite et architecture IA

Observation majeure:

- La cle API Gemini est injectee cote client via Vite (`define`), donc exposee dans le bundle frontend.

Implication:

- Toute personne avec acces au frontend peut extraire la cle.

Recommandation prioritaire:

- Deplacer l'appel Gemini cote serveur (endpoint backend/proxy), garder la cle uniquement en environnement serveur.

## 8) Incoherences / hygiene technique

- `README.md` est maintenant aligne sur le projet reel (modes local/preprod, scripts, configuration).
- `express` et `dotenv` sont utilises cote serveur (`server/index.ts`); `motion` a ete retire car non utilise.
- Le double lockfile a ete corrige (conservation de `package-lock.json`, suppression de `pnpm-lock.yaml`).
- La mention Vercel a ete retiree du code applicatif.
- Le commentaire `vite.config.ts` ne contient plus d'artefact d'encodage.

## 9) Commandes utiles

- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Type check: `npm run lint`

## 10) Risques fonctionnels identifies

- Parsing JSON durci avec extraction de l'objet JSON en fallback et validation des champs requis.
- Validation upload renforcee: whitelist MIME, taille max et rejet de fichier vide.
- Retry/backoff implemente sur les appels API (local et preprod).
- Historique local des transcriptions persiste en `localStorage` et restaurable depuis Parametres.

## 11) Roadmap conseillee (ordre recommande)

1. Securiser la cle (backend proxy Gemini): en place (mode preprod via `server/index.ts` + `/api/analyze`).
2. Ajouter validation fichier (type, poids, dimensions) + messages UX: en place (MIME whitelist, taille max, fichier vide).
3. Ajouter gestion robuste des erreurs Gemini (schema guard, fallback): en place (parse durci + fallback JSON + retry/backoff).
4. Implementer vrai drag-and-drop: a faire.
5. Rationaliser dependances et lockfiles: en place (`motion` retire, lockfile pnpm retire).
6. Mettre a jour README avec architecture et guide d'exploitation: en place.

## 12) Contexte de contenu

- App orientee francais (UI, prompt, TTS `fr-FR`).
- Cible: numerisation de livres/manuscrits pour transcription et restitution audio.
