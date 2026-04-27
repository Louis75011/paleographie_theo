import React, { Suspense, lazy } from 'react';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface LazyMarkdownProps {
    children: string;
}

export default function LazyMarkdown({ children }: LazyMarkdownProps) {
    return (
        <Suspense fallback={<p className="text-text-dim font-mono text-xs">Chargement du rendu markdown...</p>}>
            <ReactMarkdown>{children}</ReactMarkdown>
        </Suspense>
    );
}
