import React, { useEffect, useRef, useState } from "react";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

function MyDateRangePicker({ ranges, onChange, closePicker }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        closePicker(); // Call the function to close the picker when clicking outside
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return (
    <div ref={ref}>
      <DateRangePicker
        onChange={onChange}
        showSelectionPreview={true}
        moveRangeOnFirstSelection={false}
        months={1}
        ranges={ranges}
        direction="horizontal"
        closeOnSelect={true}
      />
    </div>
  );
}

export default MyDateRangePicker;
