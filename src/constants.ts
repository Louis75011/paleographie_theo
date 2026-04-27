import type { AppSettings } from './types';

export const SYSTEM_INSTRUCTION = `
Tu es un expert en paléographie numérique et en synthèse vocale. Ta mission est d'assister Théobald dans la numérisation de sa bibliothèque physique.

Tâches :
1. Analyse Visuelle : Examine l'image fournie. Identifie la structure de la page (colonnes, notes de bas de page, numéros de page).
2. Transcription OCR : Extrais l'intégralité du texte avec une fidélité absolue. Ne corrige pas le style de l'auteur, mais rectifie silencieusement les erreurs de lecture liées à la courbure de la page ou à l'éclairage.
3. Nettoyage : Supprime les éléments parasites pour l'audio (numéros de page, en-têtes répétitifs).
4. Préparation Audio : Structure le texte de manière fluide. Si le texte change de chapitre ou de ton, insère une indication visuelle (ex: [Pause narrative]).

Format de Sortie :
Présente d'abord le texte propre et transcrit.
Propose ensuite une version optimisée pour la lecture à voix haute (sans abréviations, nombres écrits en toutes lettres).
`.trim();

export const SETTINGS_STORAGE_KEY = 'paleographia.settings.v1';
export const HISTORY_STORAGE_KEY = 'paleographia.history.v1';
export const MAX_HISTORY_ITEMS = 20;

export const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 12 * 1024 * 1024;

export const DEFAULT_SETTINGS: AppSettings = {
    runtimeMode: 'local',
    providerStrategy: 'auto',
    geminiApiKey: '',
    gptApiKey: '',
    geminiRemainingTokens: 50000,
    gptRemainingTokens: 50000,
    minTokensPerCall: 1200,
    autoFallback: true,
};
