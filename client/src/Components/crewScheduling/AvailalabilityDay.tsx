import { dayTextColor } from "../../modules/hoursStyling";
import React, { useContext } from "react";
import { CrewContext } from "../../context/CrewContext";

type Shift = {
  day: string;
  shiftLength: number;
  start: string;
  end: string;
  type: string;
};

type AvailabiltyDayProps = {
  shift: Shift;
};

const AvailalabilityDay: React.FC<AvailabiltyDayProps> = ({ shift }) => {
  const { searchDay } = useContext(CrewContext);

  const abbreviated = shift.day.slice(0, 2);
  const total = shift.shifts.reduce((acc, curr) => acc + curr.length, 0);

  const shiftTime = (date) => {
    const dateTime = new Date(date);

    // Round down if minutes are less than 30, round up if 30 or more
    if (dateTime.getMinutes() < 30) {
      dateTime.setMinutes(0);
    } else {
      dateTime.setHours(dateTime.getHours() + 1);
      dateTime.setMinutes(0);
    }
    const time = dateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      hour12: true,
    });

    const formattedTime = time
      .replace(/:00 /, "")
      .replace(/^0+/, "")
      .replace(" ", "");

    return formattedTime;
  };

  const shiftColor = (shiftType: string) => {
    if (shiftType === "runShift") {
      return "bg-green-600";
    }
    if (shiftType === "shopShift") {
      return "bg-blue-600";
    }
    if (shiftType === "jobShift") {
      return "bg-yellow-600";
    }
    if (shiftType === "timeOff") {
      return "bg-black";
    }
    return "bg-sky-600";
  };

  const shiftWidth = (len) => {
    const width = Math.round(len * 10).toString();
    const pixelWidth = `${width}px`;
    return pixelWidth;
  };

  const shiftPosition = (date) => {
    const time = new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const hoursMinutes = time.split(/[.:]/);
    const hours = parseInt(hoursMinutes[0], 10);
    const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;

    const startPosition = Math.round((hours + minutes / 60) * 10).toString();
    const positionStyle = `${startPosition}px`;

    return positionStyle;
  };

  return (
    <div className="flex items-center justify-end col-span-5 gap-4 transition-transform duration-300 group/timeline max-h-5">
      <div
        className={
          searchDay === shift.day
            ? "bg-gray-700 flex justify-center items-center rounded-full w-6 h-6 "
            : ""
        }
      >
        <h2 className={`group-hover/timeline:scale-110 ${dayTextColor(total)}`}>
          {abbreviated}
        </h2>
      </div>
      <div className="relative flex h-4 transition-all duration-300 group-hover/timeline:scale-105 w-[240px] rounded-md text-black text-[.6rem] bg-gray-400 opacity-0 group-hover:opacity-100">
        {shift.shifts.map((item, index) => (
          <div className="flex flex-col" key={index}>
            <div
              className={`${shiftWidth(item.length)} ${shiftColor(
                item.type
              )} absolute max-h-4 flex-col rounded-md hover:overflow-visible p-1 align-text-top top-0  flex items-center justify-center`}
              style={{
                left: `${shiftPosition(item.start)}`,
                width: `${shiftWidth(item.length)}`,
              }}
            >
              <div className="">
                {item.type !== "timeOff" ? (
                  Math.round(item.length * 10) / 10
                ) : (
                  <span className="text-white">Time Off</span>
                )}
              </div>
            </div>
            <div
              className={`${shiftColor(
                item.type
              )} absolute w-16 text-center text-white border border-black  rounded-md opacity-0 group-hover/timeline:opacity-100 group-hover/timeline:h-4 hover:z-10`}
              style={{
                left: `${shiftPosition(item.start)}`,
                minWidth: `${shiftWidth(item.length)}`,
              }}
            >
              {`${shiftTime(item.start)}-${shiftTime(item.end)}`}
            </div>
          </div>
        ))}
      </div>
      <div className={`w-8 text-sm text-right ${dayTextColor(total)}`}>
        {total}
      </div>
    </div>
  );
};

export default AvailalabilityDay;
