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

export interface PartialVisitorPeriod {
  startDate: string;
  endDate: string;
}

export interface PartialVisitor {
  id: number;
  visitPeriods: PartialVisitorPeriod[];
}

export interface VisitorsPayload {
  fullTimeVisitorIds: number[];
  partialVisitors?: PartialVisitor[];
}

export interface CreateVisitRequest {
  name: string;
  startDate: string;
  endDate: string;
  visitors: VisitorsPayload;
}
