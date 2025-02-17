import { useEffect, useState, useContext, useRef } from "react";
import { TimelineContext } from "../../context/TimelineContext";

const TimeBlockContainer = ({ children, period }) => {
  const timelineRef = useRef(null);
  const { setTimelineWidth } = useContext(TimelineContext);
  const [days, setDays] = useState([]);

  useEffect(() => {
    // Decide how many days to show based on the period
    let numDays = 1;
    if (period === "month") {
      numDays = 31; // Adjust to 28 or the actual number of days in the month if needed
    } else if (period === "week") {
      numDays = 7;
    } else if (period === "day") {
      numDays = 1;
    }
    setDays(Array.from({ length: numDays }, (_, i) => i + 1));

    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [period, setTimelineWidth]);

  return (
    <div className="flex justify-center w-full gap-4 items-top">
      <div ref={timelineRef} className="relative w-full">
        <div className="flex flex-wrap justify-between w-full h-6 text-white rounded bg-secondaryVarLight">
          {period === "month"
            ? days.map((day) => (
                <div
                  key={day}
                  className="flex-1 min-w-[30px] text-center border-r last:border-r-0"
                >
                  {day}
                </div>
              ))
            : period === "week"
            ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <div key={index} className="flex-1 text-center border">
                    {day}
                  </div>
                )
              )
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

export default TimeBlockContainer;
