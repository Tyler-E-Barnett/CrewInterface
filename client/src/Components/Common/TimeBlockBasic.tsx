import { useContext } from "react";
import { TimelineContext } from "../../context/TimelineContext";
import { toLocalTime } from "../../modules/dateInfo";

type TimeBlockProps = {
  start: string;
  end?: string | null; // Making `end` optional and can be null
  timeLineWidth: number;
  style: string;
  title: string;
  height: string;
  type: string;
  timeScale: string;
};

function rangeScale(start, end): number {
  const diffInMilliseconds: number = end - start;
  const millisecondsInADay: number = 24 * 60 * 60 * 1000;
  const days: number = Math.round(diffInMilliseconds / millisecondsInADay);

  if (days < 1) {
    return 24;
  }
  return days * 24;
}

function timeDiffInHours(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffInMilliseconds: number = endDate.getTime() - startDate.getTime();
  const millisecondsInAnHour: number = 60 * 60 * 1000;
  const diffInHours: number = diffInMilliseconds / millisecondsInAnHour;
  return diffInHours;
}

const TimeBlockBasic: React.FC<TimeBlockProps> = ({
  start,
  end,
  timeLineWidth,
  style,
  title,
  height,
  type,
  timeScale,
}) => {
  const { range } = useContext(TimelineContext)!;
  const { startDate, endDate } = range;
  const startString = toLocalTime(start);
  const endString = !end ? "missing" : toLocalTime(end);

  const scale = rangeScale(startDate, endDate);
  const scaledStart = timeDiffInHours(startDate, start);
  const blockLength = timeDiffInHours(start, end);
  const blockWidth = blockLength * (timeLineWidth / scale);
  const blockStartPosition = scaledStart * (timeLineWidth / scale);

  return (
    <div
      className={`${style} absolute text-xs group shadow-lg flex justify-center p-2 transition-transform duration-300 rounded-md `}
      style={{
        left: `${blockStartPosition}px`,
        width: `${blockWidth}px`,
        height: `${height}px`,
      }}
    >
      {scale <= 180 && <div>{title}</div>}

      <div
        className={`${
          scale > 24 &&
          "z-20 bg-black text-white rounded items-start justify-center opacity-0 group-hover:opacity-100"
        } absolute top-full mt-1 w-32 text-onSurface flex flex-col`}
      >
        {/* <div className="w-full">{title}</div> */}
        <div className="w-full">
          {startString} - {endString}
        </div>
      </div>
    </div>
  );
};

export default TimeBlockBasic;
