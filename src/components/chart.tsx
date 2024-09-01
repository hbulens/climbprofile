import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from 'recharts';
import { ClimbProfile } from './generator';

export interface ElevationPoint {
    distance: number;
    elevation: number;
    altitude?: number; // Optional for altitude
}

export interface ClimbProfileProps {
    climbProfile: ClimbProfile;
}

const ClimbProfileChart: React.FC<ClimbProfileProps> = ({ climbProfile }) => {

    if (!climbProfile)
        return <p>Loading...</p>;

    // Define data for elevation and altitude
    const data = climbProfile.sections.map(section => ({
        distance: section.start,
        elevation: section.delta,
        altitude: section.altitude,
        gradient: section.gradient
    }));

    // Calculate Y-axis domain
    const allElevations = data.map(d => d.elevation);
    const allAltitudes = data.map(d => d.altitude || 0); // Ensure altitude is 0 if not defined
    const minElevation = Math.min(...allElevations);
    const maxElevation = Math.max(...allElevations);
    const minAltitude = Math.min(...allAltitudes);
    const maxAltitude = Math.max(...allAltitudes);

    return (
        <ResponsiveContainer width="100%" height={500}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="distance"
                    label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: 0 }}
                />

                <YAxis
                    yAxisId="left"
                    label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
                    domain={[Math.min(minElevation, minAltitude), Math.max(maxElevation, maxAltitude)]}
                    tickFormatter={(value) => `${value} m`}
                />
                <Tooltip />
                <Legend />
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="elevation"
                    stroke="#8884d8"
                    fillOpacity={0.3}
                    fill="#8884d8"
                    name="Elevation"
                />
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="altitude"
                    stroke="#82ca9d"
                    fillOpacity={0.3}
                    fill="#82ca9d"
                    name="Altitude"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default ClimbProfileChart;
