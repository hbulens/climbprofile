import Section from "./section";

export interface ClimbProfile {
    minElevation: number;
    maxElevation: number;
    distance: number;
    gradient: number;
    rawGpx?: Section[];
    intervals?: Section[];
    totalClimbing: number;
    totalDescending: number;
}
