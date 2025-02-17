import { TimelineContextProvider } from "../../context/TimelineContext";

function TimeBlockInterface({ children }) {
  return <TimelineContextProvider>{children}</TimelineContextProvider>;
}

export default TimeBlockInterface;
