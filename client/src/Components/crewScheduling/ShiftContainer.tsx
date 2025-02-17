import React, { useState, useContext, useRef, useEffect } from "react";
import { crewPersonnel } from "../../modules/crewPersonnel";
import { ShiftContext } from "../../context/ShiftContext";
import ShiftTimeline from "./ShiftTimeline";
import XIcon from "../../assets/XIcon";
import ShiftEntry from "./ShiftEntry";

const ShiftContainer = ({ shift }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { shifts, setShifts } = useContext(ShiftContext);
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
    const targetName = event.currentTarget.value;
    const personShift = shifts.find((person) => person.name === targetName);

    if (!personShift || personShift.name === "Staffing") {
      const updatedShifts = shifts.map((item) => {
        if (item.name === shift.name) {
          return { ...item, name: targetName };
        }
        return item;
      });

      setShifts(updatedShifts);
    }
    setShowOptions(false);
  };

  const handleDeleteShift = () => {
    const updatedShifts = shifts.filter((item) => item.name !== shift.name);
    setShifts(updatedShifts);
  };

  const name = shift.name;
  const person = crewPersonnel.find((person) => person.name === name);
  const headshot = person.headshot;

  return (
    <div className="relative flex items-center justify-start h-full gap-8 p-4 rounded-md shadow-sm shadow-slate-700">
      <div className="flex flex-col items-center w-24 h-full text-xs ">
        <div className="flex justify-center">
          <button onClick={handleOptionsClick}>
            <div className="flex items-center justify-center w-16 h-16 transition-transform duration-300 bg-black border-2 border-white rounded-full hover:scale-110">
              <img
                className="max-w-full max-h-full rounded-full"
                src={headshot}
                alt={name}
              />
            </div>
          </button>
        </div>
        <h2 className="w-32 mt-2 text-center text-white truncate">
          {shift.name}
        </h2>
        <div className="relative flex">
          <div
            ref={optionsRef}
            className={`flex absolute z-10 left-20 -top-10 flex-wrap justify-center gap-2 p-2 mt-2 bg-black rounded-md cursor-pointer w-[900px] transition-all duration-300 ${
              showOptions ? "opacity-100 " : "opacity-0 pointer-events-none"
            }`}
          >
            {crewPersonnel.map((profile, index) => (
              <div
                key={index}
                className="flex items-center w-48 p-2 mt-2 text-sm rounded-md overflow-clip hover:bg-green-500 bg-cardColor"
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
      <div className="flex w-full h-24 gap-8 pb-8">
        <ShiftTimeline name={name} />
        <button
          onClick={handleDeleteShift}
          className="rounded-full hover:bg-red-700"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};

export default ShiftContainer;
