import React, { useState, useEffect, useRef } from 'react';
import { RouteCalculator } from './lib/generator';
import ClimbProfileChart from './components/chart';
import Minimap from './components/minimap';
import { ClimbProfile } from './lib/climbprofile';
import RouteVisualizer from './components/route';
import ClimbProfileTable from './components/table';

const App: React.FC = () => {
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(Infinity);
  const [originalClimbProfile, setOriginalClimbProfile] = useState<ClimbProfile>();
  const [climbProfile, setClimbProfile] = useState<ClimbProfile>();
  const [gpx, setGpx] = useState<string>("");
  const [interval, setInterval] = useState<number>(1000);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const svgRef = useRef<SVGSVGElement>(null); // Create svgRef for ClimbProfileChart

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
    const profile = processor.generateProfile(startKm, endKm + 1, interval);
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

  // Function to export SVG to PNG
  const exportToPng = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      canvas.width = svg.clientWidth;
      canvas.height = svg.clientHeight;
      context?.drawImage(img, 0, 0);

      const a = document.createElement('a');
      a.download = 'climb-profile.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <nav className="w-full bg-primary text-white p-4 shadow-md">
        <div className="max-w-8xl mx-auto flex justify-between items-center">
          <img src="logo.png" alt="Logo" style={{ height: 50 }} />
        </div>
      </nav>

      {/* Main Content */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-8xl mt-10">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload GPX File</label>
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mt-2 p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interval (meters)</label>
            <select
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value))}
              className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value={100}>100m</option>
              <option value={200}>200m</option>
              <option value={500}>500m</option>
              <option value={1000}>1000m</option>
            </select>
          </div>

          <div className="flex justify-center mb-4">
            <button onClick={() => setZoomLevel(zoomLevel > 0 ? -1 : zoomLevel - 1)} className="p-2 bg-green-500 text-white rounded mx-2 hover:bg-green-600">
              -
            </button>
            <button onClick={() => setZoomLevel(zoomLevel < 0 ? 1 : zoomLevel + 1)} className="p-2 bg-red-500 text-white rounded mx-2 hover:bg-red-600">
              +
            </button>
            <button onClick={() => { }} className="p-2 bg-gray-500 text-white rounded mx-2 hover:bg-red-600">
              Snap end to summit
            </button>
            <button onClick={() => exportToPng()} className="p-2 bg-orange-500 text-white rounded mx-2 hover:bg-red-600">
              Export
            </button>
          </div>

          <div className="mt-8">
            {climbProfile && (
              <>
                <ClimbProfileChart climbProfile={climbProfile} zoomLevel={zoomLevel} svgRef={svgRef} />
                <Minimap climbProfile={originalClimbProfile!} setStartKm={setStartKm} setEndKm={setEndKm} />
                <RouteVisualizer route={gpx} startKm={startKm} endKm={endKm} />
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
