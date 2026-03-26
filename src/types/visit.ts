export interface CabinVisit {
  id: number;
  name: string;
  startDate: string; // ISO string from Kotlin's LocalDate
  endDate: string;   // ISO string from Kotlin's LocalDate
}

export interface CabinVisitsResponse {
  visitSummaries: CabinVisit[];
}
