import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { ClimbProfile } from '../lib/climbprofile';
import Section from '../lib/section';

interface ClimbProfileProps {
    climbProfile: ClimbProfile;
    zoomLevel?: number;
    svgRef: React.RefObject<SVGSVGElement>;
    chartWidth?: number;
}

const ClimbProfileChart: React.FC<ClimbProfileProps> = ({ climbProfile, zoomLevel = 1, svgRef, chartWidth = 800 }) => {
    const [height, setHeight] = useState(400); // Adjusted default height

    // First useEffect to handle height adjustment based on zoomLevel
    useEffect(() => {
        if (zoomLevel && svgRef.current) {
            const baseHeight = (svgRef.current.clientHeight || 400) - 40 - 5; // Adjust for margins
            setHeight(Math.min(1000, baseHeight + zoomLevel * 10));
        }
    }, [zoomLevel]);

    // Second useEffect to handle drawing the chart
    useEffect(() => {
        if (!climbProfile) return;

        // Set up dimensions and margins
        const margin = { top: 5, right: 60, bottom: 40, left: 50 }; // Increased left margin for padding
        const width = chartWidth - margin.left - margin.right; // Use chartWidth directly

        const data = climbProfile.sections;
        const xScale = createXScale(data, width);
        const yScale = createYScale(data, height);

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        setupSvgAttributes(svg, margin, width, height);
        drawChartSections(svg, data, xScale, yScale, height, margin);
        drawElevations(svg, data, xScale, yScale, margin);
        drawAxes(svg, xScale, yScale, width, height, margin);
    }, [climbProfile, height, chartWidth]); // Include chartWidth in the dependency array

    return <svg ref={svgRef} />;
};

// Helper method to create X scale
const createXScale = (data: Section[], width: number) => {
    return d3.scaleLinear()
        .domain(d3.extent(data, d => d.start) as [number, number])
        .range([0, width]);
};

// Helper method to create Y scale
const createYScale = (data: Section[], height: number) => {
    const yPadding = 80; // Additional padding on the Y-axis

    // Ensure the min and max elevation values are recalculated based on the data
    const minElevation = d3.min(data, d => d.minElevation) || 0;
    const endElevation = d3.max(data, d => d.endElevation) || 0;

    return d3.scaleLinear()
        .domain([minElevation - yPadding, endElevation + yPadding])
        .nice() // Makes the axis end in round values
        .range([height, 0]);
};

// Helper method to set up SVG attributes
const setupSvgAttributes = (
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    margin: { top: number; right: number; bottom: number; left: number },
    width: number,
    height: number
) => {
    svg
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', `${width + margin.left + margin.right}px`) // Set SVG width based on chartWidth
        .style('height', '100%');
};

// Helper method to draw the chart sections
const drawChartSections = (
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    data: Section[],
    xScale: d3.ScaleLinear<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
) => {
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
                .y(d => yScale(d.endElevation));

            const area = d3.area<Section>()
                .x(d => xScale(d.start) + margin.left)
                .y0(height)
                .y1(d => yScale(d.endElevation));

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
                .attr('x', xScale(d.start) + margin.left + (xScale(next.start) - xScale(d.start)) / 2)
                .attr('y', yScale(d.endElevation) + 20)
                .attr('text-anchor', 'middle')
                .attr('fill', '#FFFFFF') // White text color
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .text(`${d.gradient}%`);
        }
    });
};

// Helper method to draw elevation labels
const drawElevations = (
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    data: Section[],
    xScale: d3.ScaleLinear<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>,
    margin: { top: number; right: number; bottom: number; left: number }
) => {
    // Add elevation at the beginning of the chart (inside the chart area)
    svg.append('text')
        .attr('x', xScale(data[0].start) + margin.left)
        .attr('y', yScale(data[0].endElevation))
        .attr('text-anchor', 'start')
        .attr('fill', 'black') // Black text color
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .attr('transform', `rotate(-90, ${xScale(data[0].start) + margin.left - 10}, ${yScale(data[0].endElevation)})`) // Rotate text vertically
        .text(`${Math.round(data[0].minElevation)} m`);

    // Add elevation at the end of the chart (inside the chart area)
    const lastPoint = data[data.length - 1];
    const lastPointXPos = xScale(lastPoint.start) + margin.left;
    const lastPointYPos = yScale(lastPoint.endElevation);

    // Adjust position to avoid overlap with the line chart
    svg.append('text')
        .attr('x', lastPointXPos - 10) // Adding horizontal buffer
        .attr('y', lastPointYPos - 15) // Adding vertical buffer
        .attr('text-anchor', 'end')
        .attr('fill', 'black') // Black text color
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .attr('transform', `rotate(-90, ${lastPointXPos - 30 - 0}, ${lastPointYPos - 30})`) // Rotate text vertically
        .text(`${Math.round(lastPoint.endElevation)}m`);
};

// Helper method to draw X and Y axes
const drawAxes = (
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
) => {
    // Generate tick values for the X-axis (1 km interval)
    const xDomain = xScale.domain();
    const xTickValues = d3.range(Math.ceil(xDomain[0]), Math.floor(xDomain[1]) + 1, 1);

    // Add X-axis with 1 km interval
    svg.append('g')
        .attr('transform', `translate(${margin.left},${height + margin.top})`)
        .call(d3.axisBottom(xScale)
            .tickValues(xTickValues)
            .tickFormat(d => `${d}`))
        .selectAll('text')
        .style('font-weight', 'bold')
        .style('font-size', '12px');

    // Add Y-axis on the right side with padding
    svg.append('g')
        .attr('transform', `translate(${width + margin.left},${margin.top})`)
        .call(d3.axisRight(yScale)
            .ticks(5)
            .tickFormat(d => `${d}`))
        .style('font-weight', 'bold')
        .style('font-size', '12px');
};


export default ClimbProfileChart;
