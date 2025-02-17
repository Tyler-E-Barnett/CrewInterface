function NavButton({ children, isActive }) {
  const activeClass = isActive ? "text-xl" : "";
  return (
    <button
      className={`${activeClass} p-2 underline transition-all duration-300 rounded-lg underline-offset-4 text-onSecondaryVar hover:brightness-110 hover:text-white hover:underline-offset-8 hover:scale-105`}
    >
      {children}
    </button>
  );
}

export default NavButton;
