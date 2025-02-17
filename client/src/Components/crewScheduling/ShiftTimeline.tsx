import { useContext, useEffect, useState, useRef } from "react";
import { ShiftContext } from "../../context/ShiftContext";
import ShiftEntry from "./ShiftEntry";
import ShiftBlock from "./ShiftBlock";

const ShiftTimeline = ({ name }) => {
  const { shifts, setShifts } = useContext(ShiftContext);
  const [userShifts, setUserShifts] = useState(); // Initialize as an empty array
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  //   used to get timeline width to scales shifts
  const timelineRef = useRef(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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

  useEffect(() => {
    const personShift = shifts.find((person) => person.name === name);
    if (personShift) {
      // Check if personShift is not undefined
      setUserShifts(personShift);
    }
  }, [shifts, name]); // Add dependencies to useEffect

  const handleClick = () => {
    setShowOptions(!showOptions);
  };

  return (
    <div className="relative w-full h-full">
      <button onClick={handleClick} className="w-full h-full">
        <div
          ref={timelineRef}
          className="w-full h-12 border rounded-lg border-slate-900 bg-slate-700 hover:border-slate-500"
        >
          {timelineWidth}
        </div>
      </button>
      <div className="flex">
        {userShifts &&
          userShifts.shifts.map((shift, index) => (
            <div key={index} className="">
              <ShiftBlock
                start={shift.start}
                end={shift.end}
                timeLineWidth={timelineWidth}
              />
            </div>
          ))}
      </div>

      <div
        className={`flex absolute justify-center w-full ${
          showOptions ? " opacity-100 z-10" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="" ref={optionsRef}>
          {userShifts && <ShiftEntry name={userShifts.name} />}
        </div>
      </div>
    </div>
  );
};

export default ShiftTimeline;
