import { useEffect, useState, useContext, useRef } from "react";
import { TimelineContext } from "../../context/TimelineContext";

const TimeBlockContainerDynamic = ({ children }) => {
  const timelineRef = useRef(null);
  const { setTimelineWidth, range } = useContext(TimelineContext)!;
  const [days, setDays] = useState([]);
  const [week, setWeek] = useState([]);
  const { startDate, endDate } = range;

  const weekDays: { [key: number]: string } = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  useEffect(() => {
    const updateTimeline = () => {
      const startDay = startDate.getDate();
      const startWeekDay = startDate.getDay();
      const diffInMilliseconds: number = endDate - startDate;
      const millisecondsInADay: number = 24 * 60 * 60 * 1000;
      const diffInDays: number = Math.round(
        diffInMilliseconds / millisecondsInADay
      );

      setDays(Array.from({ length: diffInDays }, (_, i) => startDay + i));

      const dayRange: string[] = Array.from({ length: diffInDays }, (_, i) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i); // Increment the date by i days
        const currDay = currentDate.getDay(); // Get the day of the week (0-6)
        return weekDays[currDay]; // Get the corresponding day name
      });
      setWeek(dayRange);

      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };

    updateTimeline();
    window.addEventListener("resize", updateTimeline);
    return () => window.removeEventListener("resize", updateTimeline);
  }, [setTimelineWidth, range, startDate, endDate]);

  return (
    <div className="flex justify-center w-full gap-4 items-top">
      <div ref={timelineRef} className="relative w-full">
        <div className="flex flex-wrap justify-between w-full h-6 text-white rounded bg-secondaryVarLight">
          {days.length > 7
            ? days.map((day) => (
                <div
                  key={day}
                  className="flex-1 min-w-[30px] text-center border-r last:border-r-0"
                >
                  {day}
                </div>
              ))
            : days.length > 1
            ? week.map((day, index) => (
                <div key={index} className="flex-1 text-center border">
                  {day}
                </div>
              ))
            : ["12am", "6am", "12pm", "6pm", "12am"].map((time, index) => (
                <div key={index} className="flex justify-between text-center">
                  {time}
                </div>
              ))}
        </div>
        {children}
      </div>
    </div>
  );
};

export default TimeBlockContainerDynamic;
