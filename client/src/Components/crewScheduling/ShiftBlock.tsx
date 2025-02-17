import { convertToAmPm } from "../../modules/dateInfo";

const ShiftBlock = ({ start, end, timeLineWidth }) => {
  function timeToNumber(time) {
    const [hours, minutes] = time.match(/\d+/g).map(Number);

    const timeInHours = hours + minutes / 60;

    if (time.includes("PM") && hours !== 12) {
      return timeInHours + 12;
    } else if (time.includes("AM") && hours === 12) {
      return timeInHours - 12;
    } else {
      return timeInHours;
    }
  }

  const startString = convertToAmPm(start);
  const endString = convertToAmPm(end);

  const startTime = timeToNumber(start);
  const endTime = timeToNumber(end);
  const shiftLength = endTime - startTime;
  const shiftWidth = shiftLength * (timeLineWidth / 24);
  const startPosition = timeToNumber(start) * (timeLineWidth / 24);

  console.log(start, end, startTime, endTime, shiftLength, shiftWidth);

  return (
    <div
      className="absolute flex items-center justify-center h-10 p-2 transition-transform duration-300 bg-green-600 rounded-md shadow-md hover:scale-105 top-3 hover:bg-green-400"
      style={{ left: `${startPosition}px`, width: `${shiftWidth}px` }}
    >
      {`${startString} - ${endString}`}
    </div>
  );
};

export default ShiftBlock;
