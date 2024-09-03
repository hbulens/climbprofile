import GPXParser from 'gpxparser';
import _ from 'lodash';
import Section from './section';
import Point from './point';
import { ClimbProfile } from './climbprofile';


export class GPXDataProcessor {
    private points: Point[] = [];

    constructor(gpxData: string) {
        this.parse(gpxData);
    }

    calculateElevation(startKm: number = 0, endKm: number = Infinity, sectionLength: number = 500): ClimbProfile {
        // Filter points within the specified range
        const section = this.pickSection(startKm, endKm);

        // Group points by kilometer segment
        const groupedByInterval = _.groupBy(section, (point: Point) => Math.floor(point.distance / sectionLength));

        // Initialize variables for the climb profile
        const sections: Section[] = [];
        let minElevation = Infinity;
        let maxElevation = -Infinity;
        let cumulativeElevation = 0;
        let previousAltitude = 0; // Track the altitude after each kilometer

        // Iterate over the grouped data using for...of and Object.entries
        for (const [kmSegment, points] of Object.entries(groupedByInterval)) {
            // Convert kmSegment to number
            const kmSegmentNumber = parseFloat(kmSegment);

            // Calculate min and max elevation for this kilometer segment
            const segmentMinElevation = _.minBy(points, 'ele')?.ele ?? 0;
            const segmentMaxElevation = _.maxBy(points, 'ele')?.ele ?? 0;

            // Round elevations
            const roundedMinElevation = Math.round(segmentMinElevation);
            const roundedMaxElevation = Math.round(segmentMaxElevation);

            // Calculate the altitude at the end of this segment
            previousAltitude = roundedMaxElevation;

            const startElevation = _(points).first().ele;
            const endElevation = _(points).last().ele;

            // Add the elevation data to the array
            const newSection = {
                distance: kmSegmentNumber * (sectionLength / 1000),
                minElevation: Math.round(startElevation),
                maxElevation: Math.round(endElevation),
                delta: endElevation - startElevation,
            };

            sections.push(newSection);

            // Update cumulative elevation
            cumulativeElevation += roundedMaxElevation - roundedMinElevation;

            // Update overall min and max elevation
            minElevation = Math.min(minElevation, roundedMinElevation);
            maxElevation = Math.max(maxElevation, roundedMaxElevation);
        }

        // Calculate total distance
        const totalDistance = sections.length;

        // Calculate average gradient
        const averageGradient = totalDistance > 0 ? (cumulativeElevation / totalDistance) : 0;

        // Construct the ClimbProfile object
        const climbProfile: ClimbProfile = {
            minElevation,
            maxElevation,
            distance: totalDistance,
            averageGradient: Math.round(averageGradient * 100) / 100, // Round to two decimal places
            sections: sections.map((kmData, index) => ({
                start: kmData.distance,
                end: kmData.distance + 1,
                gradient: Math.round((kmData.delta / sectionLength) * 100),
                delta: kmData.delta,
                altitude: index < sections.length - 1 ? sections[index + 1].maxElevation : previousAltitude
            }))
        };

        console.log(climbProfile);
        return climbProfile;
    }

    pickSection(startKm: number = 0, endKm: number = Infinity): Point[] {
        // Convert start and end distances to meters
        const startDistance = startKm * 1000;
        const endDistance = endKm * 1000;

        // Filter points within the specified range
        const section = this.points.filter(point => point.distance >= startDistance && point.distance <= endDistance);

        if (section.length > 0) {
            // Calculate the offset to make the first point's distance 0
            const distanceOffset = section[0].distance;

            // Adjust distances so that the first point in the section has a distance of 0
            section.forEach(point => { point.distance -= distanceOffset; });
        }

        return section;
    }

    private parse(gpxData: string): void {
        const gpxParser = new GPXParser();
        gpxParser.parse(gpxData);

        let cumulativeDistance = 0;

        const track = gpxParser.tracks[0];
        const segment = track.points;

        segment.forEach((pt, index) => {
            const lat = pt.lat;
            const lon = pt.lon;
            const ele = pt.ele;

            if (index > 0) {
                const prev = segment[index - 1];
                cumulativeDistance += this.calculateDistance(prev.lat, prev.lon, lat, lon);
            }

            this.points.push({ lat, lon, ele, distance: cumulativeDistance });
        });
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}
