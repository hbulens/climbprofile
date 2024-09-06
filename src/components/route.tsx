import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import gpxParser from 'gpxparser';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';

interface RouteVisualizerProps {
    route: string;
    startKm?: number;
    endKm?: number;
    width: number;
    height: number;
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ route, startKm = 0, endKm, width, height }) => {
    const [coloredPolylines, setColoredPolylines] = useState<Array<{ positions: LatLngExpression[], color: string }>>([]);
    const [bounds, setBounds] = useState<LatLngBoundsExpression>();

    useEffect(() => {
        const getRoute = () => {
            const gpx = new gpxParser();
            gpx.parse(route);

            const points = gpx.tracks[0].points.map((p: any) => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele,
                dist: p.cumDist
            }));

            // If `cumDist` is not available, calculate cumulative distance
            points.forEach((point: any, index: number) => {
                if (index === 0) {
                    point.cumDist = 0;
                } else {
                    const prevPoint = points[index - 1];
                    const distance = L.latLng(point.lat, point.lon).distanceTo(L.latLng(prevPoint.lat, prevPoint.lon)) / 1000;
                    point.cumDist = (prevPoint as any).cumDist + distance;
                }
            });

            const totalDistance = (points[points.length - 1] as any).cumDist;
            const endDistance = endKm ?? totalDistance;

            const filtered = points.filter((p: any) => p.cumDist >= startKm && p.cumDist <= endDistance);
            const filteredCoordinates = filtered.map((p: any) => [p.lat, p.lon, p.ele] as LatLngExpression);

            const minLat = Math.min(...filteredCoordinates.map((pos) => (pos as any)[0]));
            const maxLat = Math.max(...filteredCoordinates.map((pos) => (pos as any)[0]));
            const minLon = Math.min(...filteredCoordinates.map((pos) => (pos as any)[1]));
            const maxLon = Math.max(...filteredCoordinates.map((pos) => (pos as any)[1]));
            setBounds([[minLat, minLon], [maxLat, maxLon]]);

            // Function to calculate gradient and return the appropriate color
            const gradientColors = (ele1: number, ele2: number, dist: number) => {
                if (dist === 0) return '#00FF00';
                const gradient = (ele2 - ele1) / dist; // Elevation change per km

                if (gradient >= 14) return '#000';
                if (gradient >= 10) return '#FF5733';
                if (gradient >= 7) return '#FF0000';
                if (gradient >= 4) return '#FF8C00';
                if (gradient > 0) return '#00FF00';
                if (gradient <= -2) return '#00FF00';
                return '#00FF00';                      // Flat or gentle (green)
            };

            // Create colored segments based on elevation gradients
            const coloredSegments: Array<{ positions: LatLngExpression[], color: string }> = [];
            for (let i = 1; i < filteredCoordinates.length; i++) {
                const prevPoint = filteredCoordinates[i - 1];
                const currPoint = filteredCoordinates[i];

                const dist = L.latLng(prevPoint[0], prevPoint[1]).distanceTo(L.latLng(currPoint[0], currPoint[1])) / 1000; // Distance in km
                const color = gradientColors(prevPoint[2], currPoint[2], dist);

                coloredSegments.push({
                    positions: [[prevPoint[0], prevPoint[1]], [currPoint[0], currPoint[1]]],
                    color: color
                });
            }

            setColoredPolylines(coloredSegments);
        };

        getRoute();
    }, [route, startKm, endKm]);

    if (!coloredPolylines.length) return null;

    return (
        <MapContainer style={{ width, height }} bounds={bounds}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {coloredPolylines.map((segment, idx) => (
                <Polyline
                    key={idx}
                    pathOptions={{ color: segment.color, weight: 2, opacity: 0.9, smoothFactor: 1.5 }} // Thin line, smoothFactor to enhance appearance
                    positions={segment.positions}
                />
            ))}
        </MapContainer>
    );
};

export default RouteVisualizer;
