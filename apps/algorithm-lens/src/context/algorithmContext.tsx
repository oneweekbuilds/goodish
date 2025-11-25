import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AlgorithmMetrics {
    dwellTime: number;
    scrollVelocity: number;
    clickCount: number;
    hoverCount: number;
    activePostId: number | null;
    activePostInsight: string | null;
    activePostTopic: string | null;
    activePostType: string | null;
    activePostPattern: string | null;
    engagementScore: number;
    sessionInfluence: number;
}

interface AlgorithmContextType {
    metrics: AlgorithmMetrics;
    updateMetrics: (input: Partial<AlgorithmMetrics> | ((prev: AlgorithmMetrics) => Partial<AlgorithmMetrics>)) => void;
    resetMetrics: () => void;
}

const defaultMetrics: AlgorithmMetrics = {
    dwellTime: 0,
    scrollVelocity: 0,
    clickCount: 0,
    hoverCount: 0,
    activePostId: null,
    activePostInsight: null,
    activePostTopic: null,
    activePostType: null,
    activePostPattern: null,
    engagementScore: 0,
    sessionInfluence: 0,
};

const AlgorithmContext = createContext<AlgorithmContextType | undefined>(undefined);

export function AlgorithmProvider({ children }: { children: ReactNode }) {
    const [metrics, setMetrics] = useState<AlgorithmMetrics>(defaultMetrics);

    const updateMetrics = useCallback((input: Partial<AlgorithmMetrics> | ((prev: AlgorithmMetrics) => Partial<AlgorithmMetrics>)) => {
        setMetrics(prev => {
            const newMetrics = typeof input === 'function' ? input(prev) : input;
            return { ...prev, ...newMetrics };
        });
    }, []);

    const resetMetrics = () => {
        setMetrics(defaultMetrics);
    };

    return (
        <AlgorithmContext.Provider value={{ metrics, updateMetrics, resetMetrics }}>
            {children}
        </AlgorithmContext.Provider>
    );
}

export function useAlgorithm() {
    const context = useContext(AlgorithmContext);
    if (context === undefined) {
        throw new Error('useAlgorithm must be used within an AlgorithmProvider');
    }
    return context;
}
