import { useEffect, useState, useContext } from "react";
import { ShiftContext } from "../../context/ShiftContext";

const ShiftEntry = ({ name }) => {
  const [userShifts, setUserShifts] = useState();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { shifts, setShifts } = useContext(ShiftContext);

  useEffect(() => {
    if (name) {
      const person = shifts.find((shift) => shift.name === name);
      setUserShifts(person.shifts);
    }
    console.log("user shifts in entry", userShifts);
  }, [name]);

  const handleAddShift = () => {
    if (!startTime || !endTime) {
      alert("Please enter both start and end times.");
      return;
    }

    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }

    const personIndex = shifts.findIndex((shift) => shift.name === name);
    if (personIndex !== -1) {
      const newShift = { start: startTime, end: endTime };
      const updatedShifts = [...shifts];
      updatedShifts[personIndex].shifts = [
        ...updatedShifts[personIndex].shifts,
        newShift,
      ];
      setShifts(updatedShifts);
      setUserShifts(updatedShifts[personIndex].shifts);
    }
    setStartTime("");
    setEndTime("");
  };

  //   NEEDS DELETE BUTTON FOR TIMES

  return (
    <div className="flex flex-col items-center p-2 border rounded-lg w-80 bg-slate-600">
      {userShifts &&
        userShifts.map((shift, index) => (
          <div key={index} className="flex items-center mb-2">
            <div className="text-center text-white">
              {shift.start} - {shift.end}
            </div>
          </div>
        ))}
      <div className="flex items-center justify-center border rounded-lg w-72 bg-slate-200">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="px-2 py-1 border rounded-md"
        />
        <div className="mx-2">-</div>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="px-2 py-1 border rounded-md"
        />
      </div>
      <div className="flex justify-end w-full p-2 mr-2">
        <button
          onClick={handleAddShift}
          className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default ShiftEntry;
