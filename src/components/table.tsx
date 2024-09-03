import React from 'react';
import { ClimbProfile } from '../lib/climbprofile';

interface ClimbProfileTableProps {
    climbProfile: ClimbProfile;
}

const ClimbProfileTable: React.FC<ClimbProfileTableProps> = ({ climbProfile }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-8">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Start (km)</th>
                        <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Altitude (m)</th>
                        <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Gradient (%)</th>
                        <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">Distance (m)</th>
                    </tr>
                </thead>
                <tbody>
                    {climbProfile.sections.map((section, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b text-sm text-gray-700">{section.start.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b text-sm text-gray-700">{section.altitude.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b text-sm text-gray-700">{section.gradient.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b text-sm text-gray-700">{section.delta.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ClimbProfileTable;
