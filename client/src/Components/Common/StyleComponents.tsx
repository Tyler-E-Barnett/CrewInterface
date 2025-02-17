import { todayDate } from "../../modules/dateInfo";

export const PageHeader = ({ title, date }) => {
  return (
    <div className="p-6 rounded-lg">
      <h1 className="font-serif text-4xl font-bold text-onBackground">
        {title}
      </h1>
      <h3 className="text-2xl text-onBackground">{date ? todayDate : ""}</h3>
    </div>
  );
};
