import React from 'react';
import { ClimbProfile } from '../lib/climbprofile';

interface RideSummaryProps {
    climbProfile: ClimbProfile;
}

const RideSummary: React.FC<RideSummaryProps> = ({ climbProfile }) => {
    const {
        distance,
        maxElevation,
        averageGradient,
        totalClimbing,
        totalDescending
    } = climbProfile;

    return (
        <div className="ride-summary p-4 bg-white shadow-md rounded">
            <h2 className="text-xl font-bold mb-4">Ride Summary</h2>
            <ul className="list-disc pl-5">
                <li><strong>Distance:</strong> {distance.toFixed(2)} km</li>
                <li><strong>Highest Point:</strong> {maxElevation} m</li>
                <li><strong>Average Gradient:</strong> {(averageGradient * 10).toFixed(2)}%</li>
                <li><strong>Total Climbing:</strong> {totalClimbing.toFixed(2)} m</li>
                <li><strong>Total Downhill:</strong> {totalDescending.toFixed(2)} m</li>
            </ul>
        </div>
    );
};

export default RideSummary;
