import React, { useState, useEffect } from 'react';
import { ClimbProfile, GPXDataProcessor } from './components/generator';
import ClimbProfileChart from './components/chart';
import Minimap from './components/minimap';

const App: React.FC = () => {
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(Infinity);

  const [originalClimbProfile, setOriginalClimbProfile] = useState<ClimbProfile>();
  const [climbProfile, setClimbProfile] = useState<ClimbProfile>();
  const [gpx, setGpx] = useState<string>("");
  const [interval, setInterval] = useState<number>(1000);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGpx(e.target?.result as string);
        setOriginalClimbProfile(calculateProfile(e.target?.result as string));
      };

      reader.readAsText(file);
    }
  };

  const calculateProfile = (gpxData: string) => {
    const processor = new GPXDataProcessor(gpxData);

    const profile = processor.calculateElevation(startKm, endKm + 1, interval);
    setClimbProfile(profile);

    return profile;
  };

  useEffect(() => {
    if (gpx) calculateProfile(gpx);
  }, [startKm, endKm, interval]);

  useEffect(() => {
    if (gpx) {
      setOriginalClimbProfile(calculateProfile(gpx));
    }
  }, [gpx]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-8 text-center">GPX Climb Profile Generator</h1>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload GPX File</label>
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interval (meters)</label>
            <select
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value))}
              className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={100}>100m</option>
              <option value={200}>200m</option>
              <option value={500}>500m</option>
              <option value={1000}>1000m</option>
            </select>
          </div>
        </form>

        <div className="m-8">
          {climbProfile && (
            <>
              <ClimbProfileChart climbProfile={climbProfile} />
              <Minimap climbProfile={originalClimbProfile!} setStartKm={setStartKm} setEndKm={setEndKm} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
