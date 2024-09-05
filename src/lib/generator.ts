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

    generateProfile(startKm: number = 0, endKm: number = Infinity, intervalLength: number = 1000): ClimbProfile {
        const subroute = this.select(startKm, endKm);
        const subroutePerInterval = _.groupBy(subroute, (point: Point) => Math.floor(point.distance / intervalLength));

        // Initialize variables for the climb profile
        const sections: Section[] = [];
        let totalClimbing = 0;
        let totalDownhill = 0;

        Object.entries(subroutePerInterval).forEach(([segment, points], index) => {
            const sectionNo = parseFloat(segment);
            const isLastSection = (index === Object.keys(subroutePerInterval).length - 1);

            const waypoints = points as Array<Point>;

            // Calculate total meters of climbing and descending
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

            // Update overall total elevation gain/loss
            totalClimbing += climbing;
            totalDownhill += downhill;

            // For the last section, use the actual totalRouteLength instead of the section length
            const endDistance = isLastSection ? (subroute[subroute.length - 1]?.distance || 0) / 1000 : (sectionNo + 1) * intervalLength / 1000;
            const startDistance = sectionNo * intervalLength / 1000;  // Start distance in km

            const segmentLength = isLastSection ? endDistance * 1000 - sectionNo * intervalLength : intervalLength;

            sections.push({
                start: startDistance,
                end: endDistance,
                coordinate: _.last(waypoints).lat + "," + _.last(waypoints).lon,
                distance: endDistance - startDistance,
                delta: climbing - downhill,
                minElevation: _.minBy(subroute, x => x.elevation)?.elevation ?? 0,
                maxElevation: _.maxBy(subroute, x => x.elevation)?.elevation ?? 0,
                startElevation: _.first(waypoints)?.elevation ?? 0,
                endElevation: _.last(waypoints)?.elevation ?? 0,
                gradient: Math.round((climbing - downhill) / segmentLength * 100),
            });
        });

        // Calculate total distance based on the actual section length
        const totalDistance = sections.reduce((acc, section) => acc + (section.end - section.start), 0);

        // Construct the ClimbProfile object
        const climbProfile: ClimbProfile = {
            minElevation: _.minBy(sections, x => x.minElevation)?.minElevation ?? 0,
            maxElevation: _.maxBy(sections, x => x.maxElevation)?.maxElevation ?? 0,
            distance: totalDistance,
            averageGradient: (totalClimbing / (totalDistance * 100)),
            totalClimbing: totalClimbing,
            totalDescending: totalDownhill,
            sections: sections,
            rawGpx: subroute
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

        let totalDistance = 0;

        this.gpxRoute = track.points.map((pt, index) => {
            const lat = pt.lat;
            const lon = pt.lon;
            const elevation = pt.ele;

            if (index > 0) {
                const prev = track.points[index - 1];
                totalDistance += this.calculateDistance(prev.lat, prev.lon, lat, lon);
            }

            return { lat, lon, elevation, distance: totalDistance };
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
