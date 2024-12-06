import { useState } from "react";
import axios from "axios"; // You can also use fetch instead of axios

export default function Apitest() {
  const [inputValue, setInputValue] = useState(0);
  const [processedValue, setProcessedValue] = useState(0);

  const handleSubmit = async () => {
    try {
      // Sending POST request to the Python API 
      const response = await axios.post("http://localhost:8081/api/add", {
        value : inputValue,
      });
      // Update state with processed value from API
      console.log(response)
      setProcessedValue(() => {return response.data.results});
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(() => {return Number(e.target.value)})}
      />
      <button onClick={handleSubmit}>Submit</button>

      { <p> Processed Value: {processedValue}</p>}
    </div>
  );
}
