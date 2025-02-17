import { crewPersonnel } from "../../modules/crewPersonnel";

const CrewDropdownList = ({ onSelect, ref }) => {
  return (
    <div
      ref={ref}
      className="flex flex-wrap justify-center gap-2 p-2 mt-2 bg-black rounded-md cursor-pointer"
    >
      {crewPersonnel.map((profile, index) => (
        <div
          key={index}
          className="flex items-center w-48 p-2 mt-2 text-sm rounded-md overflow-clip hover:bg-green-500 bg-cardColor"
        >
          <button value={profile.name} onClick={onSelect}>
            <div className="flex gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-black border border-white rounded-full">
                <img
                  src={profile.headshot}
                  alt={profile.initials}
                  className="max-w-full max-h-full rounded-full"
                />
              </div>
              <div className="text-white truncate ">{profile.name}</div>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

export default CrewDropdownList;
