import React, { useState, createContext, ReactNode } from "react";

interface CrewContextType {
  searchDay: string;
  setSearchDay: (day: string) => void;
}

export const CrewContext = createContext<CrewContextType | null>(null);

interface CrewContextProviderProps {
  children: ReactNode;
}

export const CrewContextProvider: React.FC<CrewContextProviderProps> = ({
  children,
}) => {
  const [searchDay, setSearchDay] = useState("");

  return (
    <CrewContext.Provider value={{ searchDay, setSearchDay }}>
      {children}
    </CrewContext.Provider>
  );
};
