export default interface Section {
    start: number;
    end: number;
    distance: number;

    delta: number;
    minElevation: number;
    maxElevation: number;
    startElevation: number;
    endElevation: number;

    gradient: number;
    coordinate: string;
}
