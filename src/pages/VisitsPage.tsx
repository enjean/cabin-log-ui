import React from 'react';
import { useParams } from 'react-router-dom'; // Standard routing hook
import { useQuery } from '@tanstack/react-query';
import { getVisitsByCabin } from '../api/visitApi';

const VisitsPage: React.FC = () => {
  // Grab "cabinId" from the URL path: /cabins/:cabinId
  const { cabinId } = useParams<{ cabinId: string }>();

  const { data: visits, isLoading, error } = useQuery({
    // Include cabinId in the key so the query is unique per cabin!
    queryKey: ['visits', cabinId], 
    queryFn: () => getVisitsByCabin(cabinId!),
    enabled: !!cabinId, // Only run if we actually have an ID
  });

  if (isLoading) return <div>Loading visits for Cabin {cabinId}...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div>
      <h1>Cabin Visits</h1>
      <ul>
        {visits?.map(visit => (
          <li key={visit.id}>{visit.name}: {visit.startDate} - {visit.endDate}</li>
        ))}
      </ul>
    </div>
  );
};

export default VisitsPage;
