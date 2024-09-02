import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface Section {
    start: number;
    delta: number;
    altitude: number;
    gradient: number;
}

interface ClimbProfile {
    minElevation: number;
    maxElevation: number;
    distance: number;
    averageGradient: number;
    sections: Section[];
}

interface MinimapProps {
    climbProfile: ClimbProfile;
    setStartKm: (km: number) => void;
    setEndKm: (km: number) => void;
}

const Minimap: React.FC<MinimapProps> = ({ climbProfile, setStartKm, setEndKm }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [selectedStartKm, setSelectedStartKm] = useState<number>(0);
    const [selectedEndKm, setSelectedEndKm] = useState<number>(climbProfile.distance);

    // Using climbProfile distance for the scale
    const startKm = 0;
    const endKm = climbProfile.distance;

    useEffect(() => {
        const data = climbProfile.sections;

        // Set up dimensions and margins
        const margin = { top: 10, right: 10, bottom: 30, left: 40 }; // Added left margin
        const width = (svgRef.current?.clientWidth || 800) - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom; // Set height to 200px

        const xScale = d3.scaleLinear()
            .domain([startKm, endKm])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.altitude) || 0])
            .range([height, 0]);

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        svg
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '95%') // Fixed width
            .style('height', '150px'); // Fixed height

        // Draw the elevation line
        const line = d3.line<Section>()
            .x(d => xScale(d.start) + margin.left) // Apply margin
            .y(d => yScale(d.altitude));

        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#E4002B')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Draw the gray overlay for the selected area
        svg.append('rect')
            .attr('x', xScale(selectedStartKm) + margin.left)
            .attr('y', 0)
            .attr('width', xScale(selectedEndKm) - xScale(selectedStartKm))
            .attr('height', height)
            .attr('fill', 'gray')
            .attr('opacity', 0.3);

        // Add sliders for start and end
        const dragStart = d3.drag()
            .on('drag', (event) => {
                const newStartKm = Math.min(Math.max(startKm, xScale.invert(event.x - margin.left)), selectedEndKm);
                setStartKm(newStartKm);
                setSelectedStartKm(newStartKm);
            });

        const dragEnd = d3.drag()
            .on('drag', (event) => {
                const newEndKm = Math.max(Math.min(xScale.invert(event.x - margin.left), endKm), selectedStartKm);
                setEndKm(newEndKm);
                setSelectedEndKm(newEndKm);
            });

        // Start slider handle
        svg.append('rect')
            .attr('x', xScale(selectedStartKm) + margin.left - 5)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', height)
            .attr('fill', '#AAFF00')
            .attr('cursor', 'ew-resize')
            .call(dragStart);

        // End slider handle
        svg.append('rect')
            .attr('x', xScale(selectedEndKm) + margin.left - 5)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', height)
            .attr('fill', '#880808')
            .attr('cursor', 'ew-resize')
            .call(dragEnd);

    }, [climbProfile, selectedStartKm, selectedEndKm, setStartKm, setEndKm]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default Minimap;
