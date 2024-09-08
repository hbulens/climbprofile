import { ClimbProfile } from "./climbprofile";

export default interface Section extends ClimbProfile {
    start: number;
    end: number;
    delta: number;
    startElevation: number;
    endElevation: number;
}
