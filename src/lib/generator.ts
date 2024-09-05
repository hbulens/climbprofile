import GPXParser from 'gpxparser';
import _ from 'lodash';
import Section from './section';
import Point from './point';
import { ClimbProfile } from './climbprofile';

export class RouteCalculator {
    private gpxRoute: Point[] = [];

    constructor(gpxData: string) {
        this.parse(gpxData);
    }

    generateProfile(startKm: number = 0, endKm: number = Infinity, sectionLength: number = 1000): ClimbProfile {
        const subroute = this.select(startKm, endKm);
        const subroutePerInterval = _.groupBy(subroute, (point: Point) => Math.floor(point.distance / sectionLength));

        // Initialize variables for the climb profile
        const sections: Section[] = [];
        let cumulativeClimbing = 0;
        let cumulativeDownhill = 0;

        Object.entries(subroutePerInterval).forEach(([segment, points], index) => {
            const segmentNumber = parseFloat(segment);
            const isLastSection = (index === Object.keys(subroutePerInterval).length - 1);

            const waypoints = points as Array<Point>;
            const { climbing, downhill } = waypoints.reduce((acc, pt, idx) => {
                if (idx > 0) {
                    const prev: Point = waypoints[idx - 1];
                    const elevationChange = pt.elevation - prev.elevation;

                    if (elevationChange > 0) {
                        acc.climbing += elevationChange;
                    } else {
                        acc.downhill += Math.abs(elevationChange);
                    }
                }
                return acc;
            }, { climbing: 0, downhill: 0 });

            // For the last section, use the actual totalRouteLength instead of the section length
            const actualEndDistance = isLastSection ? (subroute[subroute.length - 1]?.distance || 0) / 1000 : (segmentNumber + 1) * sectionLength / 1000;
            const segmentLength = isLastSection ? actualEndDistance * 1000 - segmentNumber * sectionLength : sectionLength;

            const segmentGradient = (climbing - downhill) / segmentLength * 100;

            // Update overall cumulative elevation gain/loss
            cumulativeClimbing += climbing;
            cumulativeDownhill += downhill;

            const startDistance = segmentNumber * sectionLength / 1000;  // Start distance in km

            sections.push({
                start: startDistance,
                end: actualEndDistance,
                coordinate: _.last(waypoints).lat + "," + _.last(waypoints).lon,
                distance: actualEndDistance - startDistance, // Correct the distance calculation
                delta: climbing - downhill,
                lowest: _.minBy(waypoints, x => x.elevation)?.elevation ?? 0,
                highest: _.last(waypoints)?.elevation ?? 0,
                gradient: Math.round(segmentGradient),
            });
        });

        // Calculate total distance based on the actual section length
        const totalDistance = sections.reduce((acc, section) => acc + (section.end - section.start), 0);

        // Construct the ClimbProfile object
        const climbProfile: ClimbProfile = {
            lowest: _.minBy(sections, x => x.lowest)?.lowest ?? 0,
            highest: _.maxBy(sections, x => x.highest)?.highest ?? 0,
            distance: totalDistance,
            averageGradient: (cumulativeClimbing / (totalDistance * 100)),
            totalClimbing: cumulativeClimbing,
            totalDescending: cumulativeDownhill,
            sections: sections,
        };

        console.log(climbProfile);
        return climbProfile;
    }

    private select(startKm: number = 0, endKm: number = Infinity): Point[] {
        // Convert start and end distances to meters
        const startDistance = startKm * 1000;
        const endDistance = endKm * 1000;

        // Filter points within the specified range
        const sections = this.gpxRoute.filter(point => point.distance >= startDistance && point.distance <= endDistance);

        // Reset starting point
        if (sections.length > 0) {
            const distanceOffset = sections[0].distance;
            return sections.map(x => ({ ...x, distance: x.distance - distanceOffset }));
        }

        return sections;
    }

    private parse(gpxData: string): void {
        const gpxParser = new GPXParser();
        gpxParser.parse(gpxData);
        const track = gpxParser.tracks[0];

        let cumulativeDistance = 0;

        this.gpxRoute = track.points.map((pt, index) => {
            const lat = pt.lat;
            const lon = pt.lon;
            const elevation = pt.ele;

            if (index > 0) {
                const prev = track.points[index - 1];
                cumulativeDistance += this.calculateDistance(prev.lat, prev.lon, lat, lon);
            }

            return { lat, lon, elevation, distance: cumulativeDistance };
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
