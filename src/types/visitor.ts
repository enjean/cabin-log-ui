export interface Visitor {
  id: number;
  name: string;
}

export interface VisitorsResponse {
    visitors: Visitor[];
}

export interface CreateVisitorRequest {
    name: string;
}
