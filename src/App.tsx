import React, { useState, useEffect } from 'react';
import { ClimbProfile, GPXDataProcessor } from './components/generator';
import ClimbProfileChart from './components/chart';

const App: React.FC = () => {
  // State for start and end kilometers
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(Infinity);

  // State for filtered elevation data  
  const [climbProfile, setClimbProfile] = useState<ClimbProfile>();
  const [gpx, setGpx] = useState<string>("");

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGpx(e.target?.result as string);
        calculateProfile(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  }

  // Calculate profile data and apply filters
  const calculateProfile = (gpxData: string) => {
    const processor = new GPXDataProcessor(gpxData);
    setClimbProfile(processor.calculateElevationPerKilometer(startKm, endKm + 1));
  }

  // Effect to recalculate profile when startKm, endKm or gpx changes
  useEffect(() => {
    if (gpx)
      calculateProfile(gpx);
  }, [gpx, startKm, endKm]);

  return (
    <div >
      <input type="file" accept=".gpx" onChange={handleFileUpload} />

      <div style={{ marginBottom: '20px' }}>
        <label>
          Start Km:
          <input
            type="number"
            value={startKm}
            onChange={(e) => {
              setStartKm(parseFloat(e.target.value));
            }}
            min={0}
          />
        </label>

        <label style={{ marginLeft: '20px' }}>
          End Km:
          <input
            type="number"
            value={endKm}
            onChange={(e) => {
              setEndKm(parseFloat(e.target.value));
            }}
            min={0}
          />
        </label>
      </div>

      <div style={{ margin: '20px' }}>
        <ClimbProfileChart climbProfile={climbProfile!} />
      </div>
    </div>
  );
};

export default App;
