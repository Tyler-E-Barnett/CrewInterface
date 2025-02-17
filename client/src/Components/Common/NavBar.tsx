import { Link, useLocation } from "react-router-dom";
import { formatDate } from "../../modules/dateInfo";
import NavButton from "./NavButton";

const NavBar = ({ children }) => {
  const location = useLocation();
  const today = formatDate(new Date());

  // Helper function to determine if the link is active
  const isActive = (path) => {
    // This will match the path exactly. You might need adjustments if you have more complex routes
    return location.pathname === path;
  };

  return (
    <div className="flex justify-between w-full gap-4 p-3 border shadow bg-secondaryVar">
      <div className="flex gap-4">
        <NavButton isActive={isActive("/")}>
          <Link to="/">Home</Link>
        </NavButton>
        <NavButton isActive={isActive("/timecard")}>
          <Link to="/timecard/mobileToday">Timecard</Link>
        </NavButton>
        <NavButton isActive={isActive(`/runStaffing/${today}`)}>
          <Link to={`/runStaffing/${today}`}>Run Staffing</Link>
        </NavButton>
        {/* <NavButton isActive={isActive("/inventory")}>
          <Link to="/inventory">Inventory</Link>
        </NavButton> */}
        <NavButton isActive={isActive("/run")}>
          <Link to="/run">Run</Link>
        </NavButton>
        <NavButton isActive={isActive("/fileUpload")}>
          <Link to="/fileUpload">Upload</Link>
        </NavButton>
        {/* <NavButton isActive={isActive("/itemCodeForm")}>
          <Link to="/itemCodeForm">Item Codes</Link>
        </NavButton> */}
        <NavButton isActive={isActive("/itemCodeEntry")}>
          <Link to="/itemCodeEntry">Item Code Entry</Link>
        </NavButton>
        <NavButton isActive={isActive("/itemAssignment")}>
          <Link to="/itemAssignment">Item Assignment</Link>
        </NavButton>
      </div>
      <div className="flex items-center justify-end gap-4">{children}</div>
    </div>
  );
};

export default NavBar;
