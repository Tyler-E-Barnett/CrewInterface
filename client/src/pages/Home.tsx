import { Routes, Route } from "react-router-dom";
import { CrewContextProvider } from "../context/CrewContext";
import CrewCardInterface from "../Components/crewScheduling/CrewCardInterface";

const Home = () => {
  return (
    <div>
      <CrewContextProvider>
        <Routes>
          <Route path="/runStaffing/:urlDate" element={<CrewCardInterface />} />
        </Routes>
      </CrewContextProvider>
    </div>
  );
};

export default Home;
