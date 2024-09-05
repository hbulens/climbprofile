import Section from "./section";

export interface ClimbProfile {
    minElevation: number; // Minimum elevation in meters
    maxElevation: number; // Maximum elevation in meters
    distance: number;
    averageGradient: number;
    sections: Section[];
    totalClimbing: number;
    totalDescending: number;
    rawGpx: Section[];
}
