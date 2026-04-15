import type { Visitor, VisitorsResponse } from "../types/visitor";
import api from "./axiosInstance";

export const getVisitorsByCabin = async (cabinId: string): Promise<Visitor[]> => {
  const { data } = await api.get<VisitorsResponse>(`/cabins/${cabinId}/visitors`);
  return data.visitors;
};
