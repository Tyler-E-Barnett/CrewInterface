import React, { useState, createContext } from "react";

type Shift = {
  name: string;
  shifts: { start: string | null; end: string | null }[];
};
// Create a context with a default value
export const ShiftContext = createContext(null);

// A component that provides the context
// consider setting searchDay to searchDate then converting when needed.  this could be mroe versitile
export const ShiftContextProvider = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);

  return (
    <ShiftContext.Provider value={{ shifts, setShifts }}>
      {children}
    </ShiftContext.Provider>
  );
};
