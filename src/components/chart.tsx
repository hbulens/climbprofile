import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ElevationPerKilometer } from './generator';

export interface ElevationPoint {
    distance: number;
    elevation: number;
}

export interface ClimbProfileProps {
    elevationData: ElevationPerKilometer[];
    averageGradients: any[]; // You may need to replace `any` with the appropriate type if available
}

const ClimbProfile: React.FC<ClimbProfileProps> = ({ elevationData }) => {
    // Calculate min and max values for Y-axis domain
    const minElevation = elevationData.length > 0 ? Math.min(...elevationData.map(point => point.elevation)) : 0;
    const maxElevation = elevationData.length > 0 ? Math.max(...elevationData.map(point => point.elevation)) : 100; // Set a default value if no data

    return (
        <ResponsiveContainer width="100%" height={500}>
            <AreaChart
                data={elevationData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: 0 }} />
                <YAxis
                    yAxisId="left"
                    label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
                    domain={[minElevation, maxElevation]}
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
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default ClimbProfile;
