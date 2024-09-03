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
    zoomLevel?: number;
}

const ClimbProfileChart: React.FC<ClimbProfileProps> = ({ climbProfile, zoomLevel = 1 }) => {
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
        const margin = { top: 20, right: 40, bottom: 20, left: 30 };
        const width = ((svgRef.current?.clientWidth || 800) - margin.left - margin.right);
        const height = ((svgRef.current?.clientHeight || 600) - margin.top - margin.bottom) + (zoomLevel * 10);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.start) as [number, number])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([
                0,
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

        const getLineColor = () => '#000000'; // Black for the line color

        const getAreaColor = (gradient: number) => {
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
                    .x(d => xScale(d.start) + margin.left)
                    .y(d => yScale(d.altitude));

                const area = d3.area<Section>()
                    .x(d => xScale(d.start) + margin.left)
                    .y0(height)
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
                    .attr('stroke-width', 3)
                    .attr('d', line);

                // Add gradient percentage labels (in white)
                svg.append('text')
                    .attr('x', xScale(d.start) + margin.left - 10 + (xScale(next.start) - xScale(d.start)) / 2)
                    .attr('y', yScale(d.altitude) + 15)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#FFFFFF') // White text color
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(`${d.gradient}%`);
            }
        });

        // Add altitude at the beginning of the chart (in white, vertical)
        svg.append('text')
            .attr('x', xScale(data[0].start) + margin.left - 25)
            .attr('y', yScale(data[0].altitude))
            .attr('text-anchor', 'middle')
            .attr('fill', '#FFFFFF') // White text color
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .attr('transform', `rotate(-90, ${xScale(data[0].start) + margin.left - 25}, ${yScale(data[0].altitude)})`) // Rotate text vertically
            .text(`${data[0].altitude} m`);

        // Add altitude at the end of the chart (in white, vertical)
        const lastPoint = data[data.length - 1];
        svg.append('text')
            .attr('x', xScale(lastPoint.start) + margin.left + 25)
            .attr('y', yScale(lastPoint.altitude))
            .attr('text-anchor', 'middle')
            .attr('fill', '#FFFFFF') // White text color
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .attr('transform', `rotate(-90, ${xScale(lastPoint.start) + margin.left + 25}, ${yScale(lastPoint.altitude)})`) // Rotate text vertically
            .text(`${lastPoint.altitude} m`);

        // Add X and Y axes
        svg.append('g')
            .attr('transform', `translate(${margin.left},${height + margin.top})`)
            .call(d3.axisBottom(xScale)
                .ticks(d3.max(data, d => d.start) || 0, 'd')
                .tickFormat(d => `${d} km`));

        // Y-axis on the right side
        svg.append('g')
            .attr('transform', `translate(${width + margin.left},${margin.top})`)
            .call(d3.axisRight(yScale)
                .ticks(5)
                .tickFormat(d => `${d} m`));

    }, [climbProfile, zoomLevel]);

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
