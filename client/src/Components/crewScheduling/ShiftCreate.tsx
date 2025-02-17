import React, { useEffect, useState, useContext, useRef } from "react";
import { ShiftContext } from "../../context/ShiftContext";
import PlusIcon from "../../assets/PlusIcon";
import ShiftContainer from "./ShiftContainer";
import { crewPersonnel } from "../../modules/crewPersonnel";

type Shift = {
  name: string;
  shifts: { start: string | null; end: string | null }[];
};

type Profile = {
  name: string;
  initials: string;
  headshot: string;
};

const ShiftCreate = () => {
  const { shifts, setShifts } = useContext(ShiftContext);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsRef]);

  const handleOptionsClick = () => {
    setShowOptions(!showOptions);
  };

  const handleSelectClick = (event) => {
    const name = event.currentTarget.value;

    const personShift = shifts.find((person) => person.name === name);

    if (!personShift || personShift.name === "Staffing") {
      const newShift = {
        name: name,
        shifts: [],
      };

      setShifts((prevShifts) => [...prevShifts, newShift]);
    }
  };

  return (
    <div className="flex justify-center w-full p-8">
      <div className="flex flex-col w-1/2 gap-4">
        {shifts.map((shift, index) => (
          <div key={index}>
            <ShiftContainer shift={shift} />
          </div>
        ))}
        <div className="relative flex mt-4 ml-3">
          <button
            className="transition-transform duration-300 hover:scale-110"
            onClick={handleOptionsClick}
          >
            <PlusIcon />
          </button>

          <div
            ref={optionsRef}
            className={`absolute trasition-opacity duration-300 flex flex-wrap justify-center gap-2 p-2 mt-2 bg-black rounded-md cursor-pointer left-28 max-w-[1430px]
              ${
                showOptions ? " opacity-100" : "opacity-0 pointer-events-none"
              }`}
          >
            {crewPersonnel.map((profile: Profile, index: number) => (
              <div
                key={index}
                className="flex items-center w-48 p-2 mt-2 text-sm transition-transform duration-300 rounded-md overflow-clip hover:bg-green-500 hover:scale-110 bg-cardColor"
              >
                <button value={profile.name} onClick={handleSelectClick}>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-black border border-white rounded-full">
                      <img
                        src={profile.headshot}
                        alt={profile.initials}
                        className="max-w-full max-h-full rounded-full"
                      />
                    </div>
                    <div className="text-white truncate ">{profile.name}</div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftCreate;
