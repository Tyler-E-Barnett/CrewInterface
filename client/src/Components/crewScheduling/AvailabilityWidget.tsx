import AvailalabilityDay from "./AvailalabilityDay";
import { hoursTextColor } from "../../modules/hoursStyling";

type Shift = {
  start: string;
  end: string;
  shiftLength: number;
  date: string;
  day: string;
  contextType: string;
};

type AvailabilityWidgetProps = {
  initials: string;
  shifts: Shift[];
};

export const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({
  shifts,
}) => {
  const total = parseFloat(
    shifts
      .reduce(
        (acc, shift) =>
          shift.contextType !== "timeOff" ? acc + shift.shiftLength : acc + 0,
        0
      )
      .toFixed(1)
  );

  const daysOfWeek = [
    "Friday",
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
  ];

  // Group shifts by day
  const groupedShifts = shifts.reduce((acc, shift) => {
    acc[shift.day] = acc[shift.day] || [];
    acc[shift.day].push({
      start: shift.start,
      end: shift.end,
      length: shift.shiftLength,
      date: shift.date,
      type: shift.contextType,
    });

    return acc;
  }, {});

  const allDaysShifts = daysOfWeek.map((day) => ({
    day: day,
    shifts: groupedShifts[day] || [],
  }));

  // console.log(allDaysShifts);

  return (
    <div className="flex flex-col items-start group-hover:items-end">
      <div className="flex flex-col items-end">
        {allDaysShifts.map((group, index) => {
          // Log the current group to the console
          // console.log("Group at index", index, ":", group);

          return (
            <div key={index} className="flex items-start justify-start">
              <AvailalabilityDay shift={group} />
            </div>
          );
        })}
      </div>
      <div className="pt-2">
        <h2 className={hoursTextColor(total)}>{total}</h2>
      </div>
    </div>
  );
};
