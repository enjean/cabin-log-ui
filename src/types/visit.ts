import type { Visitor } from "./visitor";


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

export interface CreateVisitRequest {
  name: string;
  startDate: string;
  endDate: string;
  visitors: {
    fullTimeVisitorIds: number[];
  };
}
