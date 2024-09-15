import React, { useState, useEffect, useRef } from 'react';
import { RouteCalculator } from './lib/generator';
import ClimbProfileChart from './components/chart';
import Minimap from './components/minimap';
import { ClimbProfile } from './lib/climbprofile';
import RouteVisualizer from './components/route';
import ClimbProfileTable from './components/table';
import _ from 'lodash';
import RideSummary from './components/summary';

const App: React.FC = () => {
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(Infinity);
  const [originalClimbProfile, setOriginalClimbProfile] = useState<ClimbProfile>();
  const [climbProfile, setClimbProfile] = useState<ClimbProfile>();
  const [gpx, setGpx] = useState<string>("");
  const [interval, setInterval] = useState<number>(1000);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [chartWidth, setChartWidth] = useState<number>(1200);
  const [showActualElevation, setShowActualElevation] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const intervals = [10, 20, 50, 100, 200, 500, 1000, 10000]; // Supported intervals

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
    const processor = new RouteCalculator(gpxData);
    const profile = processor.generateProfile(startKm, endKm, interval);
    setClimbProfile(profile);
    return profile;
  };

  useEffect(() => {
    if (gpx) calculateProfile(gpx);
  }, [startKm, endKm, interval]);

  useEffect(() => {
    if (gpx) {
      const profile = calculateProfile(gpx);
      setOriginalClimbProfile(profile);
      setStartKm(0);
      setEndKm(profile.distance);
      setZoomLevel(1);
    }
  }, [gpx]);

  // Function to cycle interval down
  const decreaseInterval = () => {
    const currentIndex = intervals.indexOf(interval);
    if (currentIndex > 0) {
      setInterval(intervals[currentIndex - 1]);
    }
  };

  // Function to cycle interval up
  const increaseInterval = () => {
    const currentIndex = intervals.indexOf(interval);
    if (currentIndex < intervals.length - 1) {
      setInterval(intervals[currentIndex + 1]);
    }
  };

  // Function to export SVG to PNG
  const exportToPng = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas width and height based on chartWidth state
    canvas.width = chartWidth; // Use the chartWidth state
    canvas.height = svg.clientHeight; // Keep the height of the SVG

    const img = new Image();
    img.onload = () => {
      context?.drawImage(img, 0, 0);

      const a = document.createElement('a');
      a.download = 'climb-profile.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
  };


  const increaseWidth = () => setChartWidth((prev) => Math.min(prev + 50, 1600));
  const decreaseWidth = () => setChartWidth((prev) => Math.max(prev - 50, 400));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <nav className="w-full bg-primary text-white p-4 shadow-md">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <img src="logo.png" alt="Logo" className="h-10 md:h-12" />

          {/* Right Side - File Upload and Export Button */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              className="block text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 p-2 bg-white text-gray-700"
            />
            <button
              onClick={() => exportToPng()}
              className="p-2 bg-orange-500 text-white rounded hover:bg-red-600 w-full md:w-auto"
            >
              Export
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="bg-white p-8 mt-2 rounded-lg shadow-lg w-full">
        <div className="space-y-1">
          <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0 mb-4">
            {/* Interval Section */}
            <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0">
              <label className="block text-sm font-medium text-gray-700">Interval (meters)</label>
              <div className="flex items-center space-x-2">
                <button onClick={decreaseInterval} className="p-2 bg-orange-500 text-white rounded hover:bg-red-600">
                  -
                </button>
                <span>{interval}m</span>
                <button onClick={increaseInterval} className="p-2 bg-orange-500 text-white rounded hover:bg-red-600">
                  +
                </button>
              </div>
            </div>

            {/* Snap end to summit button */}
            <button onClick={() => { }} className="w-full md:w-auto p-2 bg-gray-500 text-white rounded hover:bg-red-600">
              Snap end to summit
            </button>

            {/* Toggle actual route button */}
            <button onClick={() => setShowActualElevation(!showActualElevation)} className="w-full md:w-auto p-2 bg-gray-500 text-white rounded hover:bg-red-600">
              Toggle actual route
            </button>

            {/* Zoom and width adjustment controls */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <button onClick={decreaseWidth} className="p-2 bg-orange-500 text-white rounded hover:bg-red-600">
                  ⬅️
                </button>
                <div className="flex flex-col items-center">
                  <button onClick={() => setZoomLevel(zoomLevel > 0 ? -1 : zoomLevel - 1)} className="p-2 bg-orange-500 text-white rounded hover:bg-red-600">
                    ⬆️
                  </button>
                  <button onClick={() => setZoomLevel(zoomLevel < 0 ? 1 : zoomLevel + 1)} className="p-2 bg-orange-500 text-white rounded hover:bg-red-600 mt-2">
                    ⬇️
                  </button>
                </div>
                <button onClick={increaseWidth} className="p-2 bg-orange-500 text-white rounded hover:bg-red-600">
                  ➡️
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {climbProfile && (
              <>
                <ClimbProfileChart climbProfile={climbProfile} zoomLevel={zoomLevel} svgRef={svgRef} chartWidth={chartWidth} showActualElevation={showActualElevation} />
                <div className="">
                  <Minimap climbProfile={originalClimbProfile!} setStartKm={setStartKm} setEndKm={setEndKm} />
                </div>
                <div className="flex space-x-4 mt-4">
                  <div className="flex">
                    <RouteVisualizer route={gpx} startKm={startKm} endKm={endKm} height={400} width={600} />
                  </div>
                  <div className="flex-none w-80">
                    <RideSummary climbProfile={climbProfile} />
                  </div>
                  <div className="flex-none w-80">
                  </div>
                </div>
                <ClimbProfileTable climbProfile={climbProfile} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

