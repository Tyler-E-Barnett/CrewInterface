import { useContext, forwardRef } from "react";
import { TimelineContext } from "../../context/TimelineContext";
import { toLocalTime } from "../../modules/dateInfo";

type TimeBlockProps = {
  start: string;
  end?: string | null; // Making `end` optional and can be null
  timeLineWidth: number;
  style: string;
  title: string;
  type: string;
};

function timeToNumber(date: string): number {
  const toTime = new Date(date);
  const time = toLocalTime(toTime);

  const matchResults = time.match(/\d+/g);
  if (!matchResults) {
    console.error("Invalid time format:", time);
    return 0; // Or handle this scenario as required for your application logic
  }

  const [hours, minutes] = matchResults.map(Number);
  let timeInHours = hours + minutes / 60;

  if (time.includes("PM") && hours !== 12) {
    timeInHours += 12;
  } else if (time.includes("AM") && hours === 12) {
    timeInHours -= 12;
  }
  return timeInHours;
}

const TimeBlock: React.FC<TimeBlockProps> = ({
  start,
  end,
  timeLineWidth,
  style,
  title,
  type,
}) => {
  const { gantView } = useContext(TimelineContext);

  const startString = toLocalTime(start);

  const endString = !end ? "missing" : toLocalTime(end);

  // Set end time to one hour later if `end` is null or undefined
  if (!end || end === start) {
    const defaultEnd = new Date(start);
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    end = defaultEnd.toISOString();
  }

  const startTime = timeToNumber(start);
  let endTime = timeToNumber(end);

  // Calculate dimensions based on time
  if (endTime < startTime) {
    endTime += 24; // Handle day boundary crossing
  }

  if (endTime === startTime) {
    endTime += 1;
  }

  const shiftLength = endTime - startTime;
  const shiftWidth = shiftLength * (timeLineWidth / 24);
  const startPosition = startTime * (timeLineWidth / 24);

  return (
    <div
      className={`${style} ${
        gantView && type === "runOperation" ? "relative top-[54px] mt-1" : ""
      }   absolute overflow-hidden hover:overflow-visible text-xs group shadow-lg flex justify-center p-2 transition-transform duration-300 top-9 hover:scale-105 rounded-md  hover:brightness-125`}
      style={{ left: `${startPosition}px`, width: `${shiftWidth}px` }}
    >
      <div>{title}</div>
      <div
        className={`absolute ${
          gantView ? "top-full" : "top-full mt-1"
        } w-32 text-white overflow-visible bg-black opacity-0 group-hover:opacity-100 hover:z-30 transition-opacity duration-300`}
      >
        {startString} - {endString}
      </div>
    </div>
  );
};

export default TimeBlock;
