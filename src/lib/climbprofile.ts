import GradientSection from "./gradientsection";

export interface ClimbProfile {
    minElevation: number; // Minimum elevation in meters
    maxElevation: number; // Maximum elevation in meters
    distance: number;
    averageGradient: number;
    sections: GradientSection[]
}
