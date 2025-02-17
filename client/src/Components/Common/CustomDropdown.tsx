import { useState } from "react";
import { DownCarrot } from "../../assets/icons";

interface CustomDropdownProps {
  label: string;
  options: JobData[];
  selectedOption: JobData | null;
  onSelect: (option: JobData | null) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  selectedOption,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option: JobData | null) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <div className="">
          {selectedOption
            ? `${selectedOption.jobId} - ${selectedOption.facility.facilityName}`
            : label}
        </div>
        <DownCarrot color={"black"} style={"w-8 h-8 bg-gray-300 rounded"} />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
          <li
            onClick={() => handleOptionClick(null)}
            className="p-2 cursor-pointer hover:bg-gray-100"
          >
            None
          </li>
          {options.map((option) => (
            <li
              key={option._id}
              onClick={() => handleOptionClick(option)}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${
                option.timeblocks.length > 0 ? "text-sky-500" : "text-black-500"
              }`}
            >
              {option.jobId} - {option.facility && option.facility.facilityName}{" "}
              - {new Date(option.start).toLocaleDateString("en-US")} -{" "}
              {option.typeEvent} - {option.status} ({option.timeblocks.length})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
