import React, { createContext } from 'react';

interface FiltersContextType {
  // Add filter context properties
}

export const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FiltersContext.Provider value={{}}>
      {children}
    </FiltersContext.Provider>
  );
};

export default FiltersProvider;
