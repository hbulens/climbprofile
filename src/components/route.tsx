import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import gpxParser from 'gpxparser';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';

const RouteVisualizer = ({ route }: { route: string }) => {

    const [coordinates, setCoordinates] = useState<LatLngExpression[]>([]);
    const [track, setTrack] = useState<any>(null);
    const [center, setCenter] = useState<LatLngExpression>();
    const [bounds, setBounds] = useState<LatLngBoundsExpression>();
    const [currentLocation, setCurrentLocation] = useState<LatLngExpression>();

    useEffect(() => {
        const getRoute = async () => {
            const gpx = new gpxParser();
            gpx.parse(route);

            const positions: LatLngExpression[] = gpx?.tracks[0].points?.map((p: any) => [p.lat, p.lon]);
            setCoordinates(positions);

            setCenter(positions[0])
            setTrack(gpx);

            const avgLat = positions.reduce((sum, pos: LatLngExpression) => sum + (pos as any)[0], 0) / positions.length;
            const avgLon = positions.reduce((sum, pos: LatLngExpression) => sum + (pos as any)[1], 0) / positions.length;

            setCenter([avgLat, avgLon])

            const minLat = Math.min(...positions.map((pos) => (pos as any)[0]));
            const maxLat = Math.max(...positions.map((pos) => (pos as any)[0]));
            const minLon = Math.min(...positions.map((pos) => (pos as any)[1]));
            const maxLon = Math.max(...positions.map((pos) => (pos as any)[1]));
            setBounds([[minLat, minLon], [maxLat, maxLon]]);
        }

        getRoute();
    }, []);

    if (!center)
        return <></>;

    const svgIcon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" fill="orange" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        `,
        className: "svg-icon",
        iconSize: [24, 40],
    });

    return (
        <div className="mt-8 mt-8">
            <div style={{ height: "300px", width: "100%" }}>
                <MapContainer style={{ width: "100%", height: "100%" }} center={center} bounds={bounds} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Polyline pathOptions={{ fillColor: 'red', color: '#e86100' }} positions={coordinates} />

                    {currentLocation && (<Marker position={currentLocation!} icon={svgIcon} />)}

                </MapContainer>
            </div>
        </div>
    )
}

export default RouteVisualizer