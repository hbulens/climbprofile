import React from 'react';
import {
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    ReferenceArea,
    Defs,
    LinearGradient,
    Stop,
    AreaChart
} from 'recharts';
import { ClimbProfile } from './generator';

export interface ElevationPoint {
    distance: number;
    elevation: number;
    altitude?: number; // Optional for altitude
    gradient: number; // Gradient percentage
}

export interface ClimbProfileProps {
    climbProfile: ClimbProfile;
}

const CustomXAxisLabel = ({ x, y, value, gradient }: any) => (
    <g transform={`translate(${x},${y})`}>
        <text
            x={20}
            y={0}
            textAnchor="middle"
            fill="#ff7300"
            fontSize={15}
            dy={-10}
        >
            {`${gradient}%`}
        </text>
        <text
            x={0}
            y={20}
            textAnchor="middle"
            fill="#666"
        >
            {`${value} km`}
        </text>
    </g>
);

const getGradientColor = (gradient: number) => {
    if (gradient < 5) return '#e0f7fa'; // Light blue for low gradient
    if (gradient < 10) return '#b9fbc0'; // Light green for moderate gradient
    return '#ffccbc'; // Light orange for high gradient
};

const ClimbProfileChart: React.FC<ClimbProfileProps> = ({ climbProfile }) => {
    if (!climbProfile) return <p>Loading...</p>;

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
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>

                <defs>
                    <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e0f7fa" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="green" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffccbc" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                </defs>

                <XAxis
                    dataKey="distance"
                    label={{ position: 'insideBottomRight', offset: 0 }}
                    tick={(props) => {
                        const { x, y, payload } = props;
                        const gradient = data.find(d => d.distance === payload.value)?.gradient || 0;
                        return <CustomXAxisLabel x={x} y={y} value={payload.value} gradient={gradient} />;
                    }}
                />

                <YAxis
                    yAxisId="left"
                    label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
                    domain={[Math.min(minElevation, minAltitude), Math.max(maxElevation, maxAltitude)]}
                    tickFormatter={(value) => `${value} m`}
                />

                <Tooltip />



                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="altitude"
                    stroke="#82ca9d"
                    fillOpacity={0.2}
                    fill="#82ca9d"
                    name="Altitude"
                />

                <ReferenceArea x1={150} x2={180} y1={200} y2={300} stroke="red" strokeOpacity={0.3} />

                {/* Background shading based on gradient */}
                {data.map((entry, index) => {
                    const gradientId = entry.gradient < 5 ? 'lowGradient' : entry.gradient < 10 ? 'mediumGradient' : 'highGradient';
                    console.log(gradientId);
                    return (
                        <ReferenceArea
                            key={index}
                            // x1={index > 0 ? data[index - 1].distance : entry.distance}

                            x2={entry.distance}
                            y1={0}
                            y2={500}
                            fill={`url(#${gradientId})`}
                            fillOpacity={0.5}
                        />
                    );
                })}

            </AreaChart>
        </ResponsiveContainer>
    );
};

export default ClimbProfileChart;
