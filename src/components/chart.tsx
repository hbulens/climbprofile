import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface Section {
    start: number;
    delta: number;
    altitude: number;
    gradient: number;
}

interface ClimbProfile {
    sections: Section[];
}

interface ClimbProfileProps {
    climbProfile: ClimbProfile;
}

const ClimbProfileChart: React.FC<ClimbProfileProps> = ({ climbProfile }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const exportToPng = () => {
        const svg = svgRef.current;
        if (!svg) return;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            canvas.width = svg.clientWidth;
            canvas.height = svg.clientHeight;
            context?.drawImage(img, 0, 0);

            const a = document.createElement('a');
            a.download = 'climb-profile.png';
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
    };


    useEffect(() => {
        if (!climbProfile) return;

        const data = climbProfile.sections;

        // Set up dimensions and margins
        const margin = { top: 20, right: 30, bottom: 60, left: 40 };
        const width = (svgRef.current?.clientWidth || 800) - margin.left - margin.right;
        const height = (svgRef.current?.clientHeight || 500) - margin.top - margin.bottom;

        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.start) as [number, number])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([
                0, // Start y domain from 0 for the bottom of the chart
                d3.max(data, d => d.altitude) || 0
            ])
            .nice()
            .range([height, 0]);

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        svg
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', '100%');

        // Function to determine color based on gradient
        const getLineColor = () => {
            return '#000000'; // Black for the line color
        };

        const getAreaColor = (gradient: number) => {
            // Using the original color scheme with a subtle gradient effect
            if (gradient < -2) return 'rgba(128, 128, 128, 0.7)'; // Light gray for negative gradient
            if (gradient < 4) return 'rgba(0, 255, 0, 0.7)'; // Green for gradient < 4
            if (gradient < 7) return 'rgba(255, 165, 0, 0.7)'; // Orange for 4 <= gradient < 7
            if (gradient < 10) return 'rgba(255, 0, 0, 0.7)'; // Red for 7 <= gradient < 10
            if (gradient < 14) return 'rgba(139, 0, 0, 0.7)'; // Dark red for 10 <= gradient < 14
            return 'rgba(0, 0, 0, 0.7)'; // Black for gradient >= 14
        };

        // Draw areas and lines for each section
        data.forEach((d, i) => {
            if (i < data.length - 1) {
                const next = data[i + 1];
                const line = d3.line<Section>()
                    .x(d => xScale(d.start) + 40)
                    .y(d => yScale(d.altitude));

                const area = d3.area<Section>()
                    .x(d => xScale(d.start) + 40)
                    .y0(height) // Start from the bottom (x-axis)
                    .y1(d => yScale(d.altitude));

                // Draw the area for the current segment
                svg.append('path')
                    .datum([d, next])
                    .attr('fill', getAreaColor(d.gradient))
                    .attr('stroke', 'none')
                    .attr('d', area);

                // Draw the line for the current segment
                svg.append('path')
                    .datum([d, next])
                    .attr('fill', 'none')
                    .attr('stroke', getLineColor())
                    .attr('stroke-width', 3) // Increased line thickness
                    .attr('d', line);

                // Add gradient percentage labels
                svg.append('text')
                    .attr('x', xScale(d.start) + 30 + (xScale(next.start) - xScale(d.start)) / 2) // Center label between points
                    .attr('y', yScale(d.altitude) + 15) // Position label just above the line
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#000000') // Black text color
                    .style('font-size', '12px')
                    .style('font-weight', 'bold') // Bold text
                    .text(`${d.gradient}%`);
            }
        });

        // Add X and Y axes
        svg.append('g')
            .attr('transform', `translate(${margin.left},${height + margin.top})`)
            .call(d3.axisBottom(xScale)
                .ticks(d3.max(data, d => d.start) || 0, 'd') // Display ticks every km
                .tickFormat(d => `${d} km`));

        svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickFormat(d => `${d} m`));

    }, [climbProfile]);

    return (
        <div>
            <button onClick={exportToPng} className="mt-4 mb-4 p-2 bg-orange-500 text-white rounded">
                Export to PNG
            </button>

            <svg ref={svgRef} />
        </div>
    );
};

export default ClimbProfileChart;
