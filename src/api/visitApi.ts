import type { CabinVisit, CabinVisitsResponse } from '../types/visit';
import api from './axiosInstance';

export const getVisitsByCabin = async (cabinId: string): Promise<CabinVisit[]> => {
  const { data } = await api.get<CabinVisitsResponse>(`/cabins/${cabinId}/visits`);
  return data.visitSummaries;
};
