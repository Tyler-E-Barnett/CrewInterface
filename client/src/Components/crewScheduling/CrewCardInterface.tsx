import { useState, useContext, useEffect } from "react";
import { CrewContext } from "../../context/CrewContext";
import CrewCardContainer from "./CrewCardContainer";
import moment from "moment"; // Import moment
import { todayDate, getDateInfo, getWeekRange } from "../../modules/dateInfo";
import { useParams } from "react-router-dom";
import { ShiftContextProvider } from "../../context/ShiftContext";
import ShiftCreate from "./ShiftCreate";

const CrewCardInterface = () => {
  const { urlDate } = useParams();
  // need to change url date to reflect date
  // if this is being used as stand alone widget then this shouldnt matter
  // user wont see url in filemaker, and resetting with will rerender
  const [date, setDate] = useState(urlDate);
  const [inputDate, setInputDate] = useState(todayDate);
  const [dateRange, setDateRange] = useState(getWeekRange(todayDate));
  const { dateString, dayName } = getDateInfo(date);
  const { setSearchDay } = useContext(CrewContext);

  useEffect(() => {
    setSearchDay(dayName);
    // console.log(urlDate);
  }, [date]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setDate(moment(inputDate).format("MM-DD-YYYY"));
  };

  const handleChange = (event) => {
    setInputDate(event.target.value);
  };

  const { friday, thursday } = getWeekRange(date);

  return (
    <div
      className="w-full p-4 bg-gray-900 cursor-default rounded-xl"
      style={{ zoom: ".75" }}
    >
      <div className="mb-4">
        <CrewCardContainer date={date} />
      </div>
      <div className="flex flex-col gap-2 p-8">
        <h3 className="font-bold text-white">{`${dateString}`}</h3>
        <h4 className="text-white">{`${friday} - ${thursday}`}</h4>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
          <input
            type="date"
            value={inputDate}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      </div>
      <ShiftContextProvider>
        <ShiftCreate />
      </ShiftContextProvider>
    </div>
  );
};

export default CrewCardInterface;
