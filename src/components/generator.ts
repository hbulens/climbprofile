import GPXParser from 'gpxparser';

export interface Point {
    lat: number;
    lon: number;
    ele: number;
    distance: number;
}

export interface Gradient {
    distance: number; // Kilometers
    gradient: number; // Percentage
}

export interface GradientSection {
    start: number;
    end: number;
    gradient: number;
}

export interface ElevationPerKilometer {
    distance: number; // Kilometers
    minElevation: number; // Minimum elevation in meters
    maxElevation: number; // Maximum elevation in meters
    elevation: number; // Difference between max and min elevation
}

export class GPXDataProcessor {
    private points: Point[] = [];

    constructor(gpxData: string) {
        this.parse(gpxData);
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

    calculateElevationPerKilometer(startKm: number = 0, endKm: number = Infinity): ElevationPerKilometer[] {
        // Convert start and end distances to meters
        const startDistance = startKm * 1000;
        const endDistance = endKm * 1000;

        // Filter points within the specified range
        const section = this.pickSection(startKm, endKm);

        // Calculate elevation range per 1 km
        const elevationPerKm: ElevationPerKilometer[] = [];
        let currentKm = 0;
        let minElevation = Infinity;
        let maxElevation = -Infinity;

        section.forEach(point => {
            const kmSegment = Math.floor(point.distance / 1000);

            // Initialize the km segment if it doesn't exist
            while (elevationPerKm.length <= kmSegment) {
                elevationPerKm.push({
                    distance: kmSegment,
                    minElevation: Infinity,
                    maxElevation: -Infinity,
                    elevation: 0
                });
            }

            // Update min and max elevation for the current km segment
            if (kmSegment > currentKm) {
                if (minElevation !== Infinity && maxElevation !== -Infinity) {
                    elevationPerKm[currentKm].minElevation = minElevation;
                    elevationPerKm[currentKm].maxElevation = maxElevation;
                    elevationPerKm[currentKm].elevation = maxElevation - minElevation;
                }
                minElevation = point.ele;
                maxElevation = point.ele;
                currentKm = kmSegment;
            } else {
                minElevation = Math.min(minElevation, point.ele);
                maxElevation = Math.max(maxElevation, point.ele);
            }
        });

        // Update the last segment if it was not completed
        if (elevationPerKm.length > 0) {
            elevationPerKm[currentKm].minElevation = minElevation;
            elevationPerKm[currentKm].maxElevation = maxElevation;
            elevationPerKm[currentKm].elevation = maxElevation - minElevation;
        }

        return elevationPerKm;
    }
}
