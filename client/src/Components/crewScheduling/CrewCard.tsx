import ProgressCircle from "../Common/ProgressCircle";
import { AvailabilityWidget } from "./AvailabilityWidget";

type CrewCardProps = {
  address: string;
  cell: string;
  headshot: string;
  id: number;
  initials: string;
  name: string;
  totalHours: number;
  shifts: [
    {
      start: string;
      end: string;
      date: string;
      day: string;
      contextType: string;
      shiftLength: number;
    }
  ];
};

const CrewCard: React.FC<CrewCardProps> = ({
  id,
  name,
  initials,
  address,
  cell,
  headshot,
  shifts,
  totalHours,
}) => {
  return (
    <div
      key={id}
      className="relative grid grid-cols-6 dark:bg-cardColor gap-2 p-2 overflow-hidden text-white dark:text-white transition-all duration-300 border shadow-md max-h-52 hover:grid-cols-11 border-cardBorder w-48 hover:w-[500px] max-w-[500px] rounded-xl bg-cardColor dark:border-cardBorder hover:scale-105 group hover:mx-4" // Add transition-all for smooth expansion
    >
      <div className="flex-wrap items-center col-span-4 p-4 transition-transform duration-300 group-hover:col-span-3 w-36">
        <div className="transition-transform duration-300 group-hover:scale-110">
          <ProgressCircle
            estHours={totalHours}
            initials={initials}
            headshot={headshot}
          />
        </div>
        <ul className="flex flex-col items-start mt-2 overflow-hidden text-xs">
          <h3 className="overflow-hidden text-nowrap">{name}</h3>
          <li>{initials}</li>
          <li>{address}</li>
          <li>{cell}</li>
        </ul>
      </div>
      <div className="flex col-span-1 p-2 transition-transform duration-300 min-w-28 group-hover:col-span-1">
        <AvailabilityWidget shifts={shifts} />
      </div>
    </div>
  );
};

export default CrewCard;
