'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

interface ExperimentContextType {
  hasVoted: boolean;
  setHasVoted: (voted: boolean) => void;
  triggerRevote: () => void;
  registerRevoteHandler: (handler: () => void) => () => void;
}

const ExperimentContext = createContext<ExperimentContextType>({
  hasVoted: false,
  setHasVoted: () => {},
  triggerRevote: () => {},
  registerRevoteHandler: () => () => {},
});

export const useExperiment = () => useContext(ExperimentContext);

export const ExperimentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const revoteHandlerRef = useRef<(() => void) | null>(null);

  const registerRevoteHandler = useCallback((handler: () => void) => {
    revoteHandlerRef.current = handler;
    return () => {
      if (revoteHandlerRef.current === handler) {
        revoteHandlerRef.current = null;
      }
    };
  }, []);

  const triggerRevote = useCallback(() => {
    if (revoteHandlerRef.current) {
      revoteHandlerRef.current();
    }
  }, []);

  return (
    <ExperimentContext.Provider
      value={{
        hasVoted,
        setHasVoted,
        triggerRevote,
        registerRevoteHandler,
      }}
    >
      {children}
    </ExperimentContext.Provider>
  );
};

