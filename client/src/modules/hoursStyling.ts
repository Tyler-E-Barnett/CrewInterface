export const hoursTextColor = (hours: number) => {
  if (!hours) {
    return "text-green-400 font-bold";
  }
  if (hours <= 30) {
    return "text-green-400 font-bold";
  } else if (hours < 40) {
    return "text-orange-400 font-bold";
  } else {
    return "text-red-400 font-bold";
  }
};

export const dayTextColor = (hours: number) => {
  if (!hours) {
    return "text-sm";
  }

  if (hours <= 4) {
    return "text-yellow-500 font-bold text-sm";
  } else if (hours <= 6) {
    return "text-orange-500 font-bold text-sm";
  } else {
    return "text-red-500 font-bold text-sm";
  }
};
