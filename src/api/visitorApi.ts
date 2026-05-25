import type { Visitor, VisitorsResponse, CreateVisitorRequest } from "../types/visitor";
import api from "./axiosInstance";

export const getVisitorsByCabin = async (cabinId: string): Promise<Visitor[]> => {
  const { data } = await api.get<VisitorsResponse>(`/cabins/${cabinId}/visitors`);
  return data.visitors;
};

export const createVisitor = async (cabinId: string, visitorData: CreateVisitorRequest): Promise<Visitor> => {
  const { data } = await api.post<Visitor>(`/cabins/${cabinId}/visitors`, visitorData);
  return data;
};
