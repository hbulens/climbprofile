import Section from "./section";

export interface ClimbProfile {
    lowest: number; // Minimum elevation in meters
    highest: number; // Maximum elevation in meters
    distance: number;
    averageGradient: number;
    sections: Section[];
    totalClimbing: number;
    totalDescending: number;
    
}
