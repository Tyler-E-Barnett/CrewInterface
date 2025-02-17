export const operationColor = (operation) => {
  if (operation === "Load & Leave") {
    return "bg-green-600";
  }
  if (operation === "Load") {
    return "bg-gray-800";
  }
  if (operation === "Setup") {
    return "bg-cyan-600";
  }
  if (operation === "Leave") {
    return "bg-slate-600";
  }
  if (operation === "Unload & Out") {
    return "bg-rose-700";
  }
  if (operation === "Strike") {
    return "bg-red-700";
  }
  if (operation === "Unstow & Set") {
    return "bg-orange-800";
  }
  return "bg-black";
};
