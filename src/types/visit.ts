export interface Visitor {
  id: number;
  name: string;
}

export interface CabinVisit {
  id: number;
  name: string;
  startDate: string; // ISO string from Kotlin's LocalDate
  endDate: string;   // ISO string from Kotlin's LocalDate
  visitors: Visitor[];
}

export interface CabinVisitsResponse {
  visitSummaries: CabinVisit[];
}
