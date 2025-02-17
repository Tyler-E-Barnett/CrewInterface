const currentDate = new Date();
const todayDate = currentDate.toLocaleDateString("en-us");
import moment from "moment";

export const getDateInfo = (date: string) => {
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const newDate = new Date(date);
  const dateString = newDate.toLocaleDateString("en-US", options);
  const dayNumber = newDate.getDay();
  const dayName = weekday[dayNumber];

  return { dateString, dayName };
};

export const getWeekRange = (inputDate: string): {} => {
  const date = new Date(inputDate);
  const dayOfWeek = date.getDay();

  // Calculate the offset to the previous Friday
  const fridayOffset = dayOfWeek >= 5 ? dayOfWeek - 5 : 7 - (5 - dayOfWeek);

  // Calculate the offset to the following Thursday
  const thursdayOffset = dayOfWeek >= 5 ? 7 - (dayOfWeek - 4) : 4 - dayOfWeek;

  const friday = new Date(date);
  friday.setDate(date.getDate() - fridayOffset);

  const thursday = new Date(date);
  thursday.setDate(date.getDate() + thursdayOffset);

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return {
    friday: friday
      .toLocaleDateString("en-US")
      .replace("/", "-")
      .replace("/", "-"),
    thursday: thursday
      .toLocaleDateString("en-US")
      .replace("/", "-")
      .replace("/", "-"),
  };
};

export function convertToAmPm(time) {
  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 24-hour time to 12-hour time
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDate(date: Date) {
  return moment(date).format("MM-DD-YYYY");
}

export function getDayName(dayNumber) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  if (dayNumber < 1 || dayNumber > 7) {
    throw new Error("Invalid day number. Day number must be between 1 and 7.");
  }
  return days[dayNumber - 1];
}

export function toLocalTime(date: Date) {
  const dateTime = new Date(date);
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const time = dateTime.toLocaleTimeString(undefined, options);
  return time;
}

export function localDateTime(date) {
  const newDate = new Date(date);
  return newDate.toLocaleString("en-US");
}

export function formattedDate(date) {
  const newDate = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return newDate.toLocaleDateString("en-US", options);
}

export { todayDate };
