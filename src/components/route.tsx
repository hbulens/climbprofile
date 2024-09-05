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
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ route, startKm = 0, endKm }) => {
    const [filteredCoordinates, setFilteredCoordinates] = useState<LatLngExpression[]>([]);
    const [bounds, setBounds] = useState<LatLngBoundsExpression>();

    useEffect(() => {
        const getRoute = () => {
            const gpx = new gpxParser();
            gpx.parse(route);

            const points = gpx.tracks[0].points.map((p: any) => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele,
                dist: p.cumDist // Assume the GPX parser calculates cumulative distance
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

            // Set the default endKm to the total distance if not provided
            const totalDistance = (points[points.length - 1] as any).cumDist;
            const endDistance = endKm ?? totalDistance;

            // Filter points within the selected range
            const filtered = points.filter((p: any) => p.cumDist >= startKm && p.cumDist <= endDistance);
            const filteredCoordinates = filtered.map((p: any) => [p.lat, p.lon] as LatLngExpression);
            setFilteredCoordinates(filteredCoordinates);

            // Calculate bounds for the filtered coordinates
            const minLat = Math.min(...filteredCoordinates.map((pos) => (pos as any)[0]));
            const maxLat = Math.max(...filteredCoordinates.map((pos) => (pos as any)[0]));
            const minLon = Math.min(...filteredCoordinates.map((pos) => (pos as any)[1]));
            const maxLon = Math.max(...filteredCoordinates.map((pos) => (pos as any)[1]));
            setBounds([[minLat, minLon], [maxLat, maxLon]]);
        };

        getRoute();
    }, [route, startKm, endKm]);

    if (!filteredCoordinates.length) return null;

    return (
        <MapContainer style={{ width: '100%', height: '100%' }} bounds={bounds}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline pathOptions={{ fillColor: 'red', color: '#e86100' }} positions={filteredCoordinates} />
        </MapContainer>
    );
};

export default RouteVisualizer;
