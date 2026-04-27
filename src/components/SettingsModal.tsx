import React from 'react';
import type { AppSettings, TranscriptionHistoryEntry } from '../types';

type SettingsTab = 'settings' | 'help';

interface SettingsModalProps {
    isOpen: boolean;
    tab: SettingsTab;
    settings: AppSettings;
    onClose: () => void;
    onTabChange: (tab: SettingsTab) => void;
    onSettingsChange: (patch: Partial<AppSettings>) => void;
    onResetTokenBudgets: () => void;
    history: TranscriptionHistoryEntry[];
    onRestoreHistory: (entryId: string) => void;
    onClearHistory: () => void;
}

export default function SettingsModal({
    isOpen,
    tab,
    settings,
    onClose,
    onTabChange,
    onSettingsChange,
    onResetTokenBudgets,
    history,
    onRestoreHistory,
    onClearHistory,
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Paramètres et aide"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-panel border border-[#ddd] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-panel border-b border-[#e0dcd1] px-5 py-4 flex items-center justify-between">
                    <h2 className="font-display text-lg tracking-[0.5px] text-ink">Console de Configuration</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[11px] uppercase tracking-[1.5px] border border-[#ccc] px-3 py-1 hover:bg-black/5"
                    >
                        Fermer
                    </button>
                </div>

                <div className="px-5 pt-4 flex gap-2 border-b border-[#e0dcd1]">
                    <button
                        type="button"
                        onClick={() => onTabChange('settings')}
                        className={`px-4 py-2 text-[11px] uppercase tracking-[1.5px] border ${tab === 'settings' ? 'border-accent text-accent bg-accent/5' : 'border-[#ccc] text-ink'
                            }`}
                    >
                        Paramètres
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange('help')}
                        className={`px-4 py-2 text-[11px] uppercase tracking-[1.5px] border ${tab === 'help' ? 'border-accent text-accent bg-accent/5' : 'border-[#ccc] text-ink'
                            }`}
                    >
                        Aide
                    </button>
                </div>

                {tab === 'settings' && (
                    <div className="p-5 space-y-6">
                        <section className="space-y-3">
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim">Mode d'execution</h3>
                            <div className="flex flex-wrap gap-3">
                                <label className="text-sm flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="runtimeMode"
                                        checked={settings.runtimeMode === 'local'}
                                        onChange={() => onSettingsChange({ runtimeMode: 'local' })}
                                    />
                                    Local (cles stockees dans le navigateur)
                                </label>
                                <label className="text-sm flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="runtimeMode"
                                        checked={settings.runtimeMode === 'preprod'}
                                        onChange={() => onSettingsChange({ runtimeMode: 'preprod' })}
                                    />
                                    Preprod (cles stockees cote serveur)
                                </label>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim">Strategie de fournisseur</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="text-sm flex items-center gap-2 border border-[#ddd] p-2">
                                    <input
                                        type="radio"
                                        name="providerStrategy"
                                        checked={settings.providerStrategy === 'auto'}
                                        onChange={() => onSettingsChange({ providerStrategy: 'auto' })}
                                    />
                                    Auto
                                </label>
                                <label className="text-sm flex items-center gap-2 border border-[#ddd] p-2">
                                    <input
                                        type="radio"
                                        name="providerStrategy"
                                        checked={settings.providerStrategy === 'gemini'}
                                        onChange={() => onSettingsChange({ providerStrategy: 'gemini' })}
                                    />
                                    Gemini prioritaire
                                </label>
                                <label className="text-sm flex items-center gap-2 border border-[#ddd] p-2">
                                    <input
                                        type="radio"
                                        name="providerStrategy"
                                        checked={settings.providerStrategy === 'gpt'}
                                        onChange={() => onSettingsChange({ providerStrategy: 'gpt' })}
                                    />
                                    GPT prioritaire
                                </label>
                            </div>

                            <label className="text-sm flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.autoFallback}
                                    onChange={(e) => onSettingsChange({ autoFallback: e.target.checked })}
                                />
                                Basculer automatiquement vers l'autre fournisseur en cas de cle manquante, quota bas ou echec API.
                            </label>
                        </section>

                        <section className="space-y-3">
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim">Cles API (mode local)</h3>
                            <p className="text-xs text-text-dim">
                                En mode local, les cles sont enregistrees dans localStorage pour ce navigateur uniquement.
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <label className="text-sm">
                                    Cle Gemini
                                    <input
                                        type="password"
                                        value={settings.geminiApiKey}
                                        onChange={(e) => onSettingsChange({ geminiApiKey: e.target.value })}
                                        placeholder="AIza..."
                                        className="mt-1 w-full border border-[#ccc] px-3 py-2 text-sm"
                                        autoComplete="off"
                                    />
                                </label>
                                <label className="text-sm">
                                    Cle GPT (OpenAI)
                                    <input
                                        type="password"
                                        value={settings.gptApiKey}
                                        onChange={(e) => onSettingsChange({ gptApiKey: e.target.value })}
                                        placeholder="sk-..."
                                        className="mt-1 w-full border border-[#ccc] px-3 py-2 text-sm"
                                        autoComplete="off"
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim">Budgets tokens</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="text-sm">
                                    Tokens restants Gemini
                                    <input
                                        type="number"
                                        min={0}
                                        value={settings.geminiRemainingTokens}
                                        onChange={(e) =>
                                            onSettingsChange({ geminiRemainingTokens: Math.max(0, Number(e.target.value) || 0) })
                                        }
                                        className="mt-1 w-full border border-[#ccc] px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="text-sm">
                                    Tokens restants GPT
                                    <input
                                        type="number"
                                        min={0}
                                        value={settings.gptRemainingTokens}
                                        onChange={(e) =>
                                            onSettingsChange({ gptRemainingTokens: Math.max(0, Number(e.target.value) || 0) })
                                        }
                                        className="mt-1 w-full border border-[#ccc] px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="text-sm sm:col-span-2">
                                    Seuil mini pour autoriser un appel
                                    <input
                                        type="number"
                                        min={0}
                                        value={settings.minTokensPerCall}
                                        onChange={(e) => onSettingsChange({ minTokensPerCall: Math.max(0, Number(e.target.value) || 0) })}
                                        className="mt-1 w-full border border-[#ccc] px-3 py-2 text-sm"
                                    />
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={onResetTokenBudgets}
                                className="text-[11px] uppercase tracking-[1.5px] border border-[#ccc] px-3 py-2 hover:bg-black/5"
                            >
                                Reinitialiser les budgets par defaut
                            </button>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim">Historique local</h3>
                                <button
                                    type="button"
                                    onClick={onClearHistory}
                                    className="text-[11px] uppercase tracking-[1.5px] border border-[#ccc] px-3 py-2 hover:bg-black/5"
                                >
                                    Vider
                                </button>
                            </div>

                            {history.length === 0 && (
                                <p className="text-xs text-text-dim">Aucune transcription sauvegardee localement.</p>
                            )}

                            {history.length > 0 && (
                                <ul className="space-y-2">
                                    {history.slice(0, 8).map((entry) => (
                                        <li key={entry.id} className="border border-[#ddd] p-3 text-xs">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-text-dim">
                                                    {new Date(entry.createdAt).toLocaleString('fr-FR')} - {entry.provider.toUpperCase()}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onRestoreHistory(entry.id)}
                                                    className="text-[10px] uppercase tracking-[1.5px] border border-[#ccc] px-2 py-1 hover:bg-black/5"
                                                >
                                                    Restaurer
                                                </button>
                                            </div>
                                            <p className="mt-1 text-[#333] truncate">{entry.imageName}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                )}

                {tab === 'help' && (
                    <div className="p-5 space-y-5 text-sm leading-relaxed text-[#2f2f2f]">
                        <section>
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim mb-2">Demarrage rapide</h3>
                            <ol className="list-decimal pl-5 space-y-1">
                                <li>Ouvrez Paramètres depuis la barre basse.</li>
                                <li>Choisissez le mode Local ou Preprod.</li>
                                <li>En mode Local: collez vos cles Gemini/GPT.</li>
                                <li>Definissez vos budgets tokens et la strategie de bascule.</li>
                                <li>Importez une image puis lancez l'analyse.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim mb-2">Mode Local</h3>
                            <p>
                                Utilise directement les cles stockees dans votre navigateur. C'est pratique pour du test rapide, mais la
                                cle peut etre exposee au client web.
                            </p>
                        </section>

                        <section>
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim mb-2">Mode Preprod</h3>
                            <p>
                                Les appels passent par l'endpoint serveur <code>/api/analyze</code>. Les cles restent cote serveur via les
                                variables d'environnement.
                            </p>
                        </section>

                        <section>
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim mb-2">Bascule tokens</h3>
                            <p>
                                En mode Auto, l'app choisit le fournisseur avec le plus de tokens restants au-dessus du seuil mini. Si
                                auto-fallback est actif, elle tente l'autre fournisseur en cas d'echec ou de budget insuffisant.
                            </p>
                        </section>

                        <section>
                            <h3 className="font-display text-sm uppercase tracking-[1.5px] text-text-dim mb-2">Android et audio</h3>
                            <p>
                                Certains navigateurs Android ne supportent pas la Web Speech API. Dans ce cas, le bouton audio est
                                desactive mais la transcription reste pleinement fonctionnelle.
                            </p>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
