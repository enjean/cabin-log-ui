import type { CabinVisit, CabinVisitsResponse } from '../types/visit';
import api from './axiosInstance';

export const getVisitsByCabin = async (cabinId: string): Promise<CabinVisit[]> => {
  const { data } = await api.get<CabinVisitsResponse>(`/cabins/${cabinId}/visits`);
  return data.visitSummaries;
};

export const createVisit = async (cabinId: string, visitData: { name: string; startDate: string; endDate: string }): Promise<CabinVisit> => {
  const { data } = await api.post<CabinVisit>(`/cabins/${cabinId}/visits`, visitData);
  return data;
};
