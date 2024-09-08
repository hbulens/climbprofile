import React, { useState } from 'react';
import { ClimbProfile } from '../lib/climbprofile';

interface ClimbProfileTableProps {
    climbProfile: ClimbProfile;
}

const ClimbProfileTable: React.FC<ClimbProfileTableProps> = ({ climbProfile }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="overflow-x-auto mt-4">
            {/* Toggle button */}
            <button onClick={toggleCollapse} className="py-2 px-4 bg-orange-500 text-white rounded-lg shadow-md focus:outline-none">
                {isCollapsed ? 'Show table' : 'Hide table'}
            </button>

            {/* Conditionally render the table */}
            {!isCollapsed && (
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Start (km)</th>
                            <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Elevation (m)</th>
                            <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Gradient (%)</th>
                            <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Distance (m)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(climbProfile.intervals ?? []).map((section, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b text-sm text-gray-700">{section.start.toFixed(2)}</td>
                                <td className="py-2 px-4 border-b text-sm text-gray-700">{section.maxElevation.toFixed(2)}</td>
                                <td className="py-2 px-4 border-b text-sm text-gray-700">{section.gradient.toFixed(2)}</td>
                                <td className="py-2 px-4 border-b text-sm text-gray-700">{section.delta.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ClimbProfileTable;
