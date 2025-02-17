import React from "react";
import useFetchData from "../../Hooks/useFetchData";
import CrewCard from "./CrewCard";
import { crewPersonnel } from "../../modules/crewPersonnel";
import LoadingSpinner from "../../assets/LoadingSpinner";

type DataValues = {
  address: string;
  cell: string;
  headshot: string;
  id: number | string;
  initials: string;
  name: string;
  shifts: [
    {
      start: string;
      end: string;
      date: string;
      day: string;
      shiftLength: number;
    }
  ];
  totalHours: number;
};

type CrewInterfaceProps = {
  date: string;
};

const CrewCardContainer: React.FC<CrewInterfaceProps> = ({ date }) => {
  const { data, loading, error } = useFetchData(
    `/api/logistics/availability/${date}`
  );

  if (loading)
    return (
      <div className="flex items-center justify-center m-auto h-96">
        <div className="m-auto animate-spin spin-slow">
          <LoadingSpinner />
        </div>
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  console.log(data);

  function findIndexByProperty(array, propName, value) {
    return array.findIndex((element) => element[propName] === value);
  }

  // adds shifts to the crew personnel json

  // if undefined then dont add

  const updatedCrewPersonnel = crewPersonnel.map((user: DataValues) => {
    const idString = user.id.toString();
    // const index = findIndexByProperty(data, "_id", idString);

    // if (!index) {
    //   console.log("no index");
    //   return;
    // }

    const userData = data[idString] || {
      shifts: [],
      totalHours: 0,
    };

    return {
      ...user,
      shifts: userData.shifts,
      totalHours: userData.totalHours,
    };
  });

  const sortedData = updatedCrewPersonnel.sort(
    (a, b) => (b.totalHours || 0) - (a.totalHours || 0)
  );

  console.log(sortedData);

  const halfIndex = Math.ceil(sortedData.length / 2);
  const firstHalf = sortedData.slice(0, halfIndex);
  const secondHalf = sortedData.slice(halfIndex);

  return (
    <div className="flex flex-col items-start justify-center py-2 pl-4 m-4 overflow-x-scroll border rounded-lg border-cyan-950 pr-96 bg-containerColor">
      <div
        className="grid items-center h-[208px] grid-flow-col gap-2 overflow-x-scroll auto-cols-max"
        style={{ maxHeight: "calc(2 * 260px + 1rem)" }}
      >
        {firstHalf.map((user: DataValues) => (
          <CrewCard
            key={user.id}
            id={user.id}
            name={user.name}
            initials={user.initials}
            headshot={user.headshot}
            address={user.address}
            cell={user.cell}
            shifts={user.shifts}
            totalHours={user.totalHours}
          />
        ))}
      </div>
      <div
        className="grid items-center h-56 grid-flow-col gap-2 overflow-x-scroll auto-cols-max "
        style={{ maxHeight: "calc(2 * 260px + 1rem)" }}
      >
        {secondHalf.map((user: DataValues) => (
          <CrewCard
            key={user.id}
            id={user.id}
            name={user.name}
            initials={user.initials}
            headshot={user.headshot}
            address={user.address}
            cell={user.cell}
            shifts={user.shifts}
            totalHours={user.totalHours}
          />
        ))}
      </div>
    </div>
  );
};

export default CrewCardContainer;
