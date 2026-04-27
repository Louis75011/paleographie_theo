export interface AnalysisResult {
    originalTranscript: string;
    audioOptimizedTranscript: string;
}

export interface TranscriptionHistoryEntry {
    id: string;
    createdAt: string;
    provider: ProviderId;
    imageName: string;
    result: AnalysisResult;
}

export type ProviderId = 'gemini' | 'gpt';

export type ProviderStrategy = 'auto' | ProviderId;

export type RuntimeMode = 'local' | 'preprod';

export interface AppSettings {
    runtimeMode: RuntimeMode;
    providerStrategy: ProviderStrategy;
    geminiApiKey: string;
    gptApiKey: string;
    geminiRemainingTokens: number;
    gptRemainingTokens: number;
    minTokensPerCall: number;
    autoFallback: boolean;
}
