import React from 'react';
import { useParams } from 'react-router-dom'; // Standard routing hook
import { useQuery } from '@tanstack/react-query';
import { getVisitsByCabin } from '../api/visitApi';
import './VisitsPage.css';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

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
    <div className="visits-container">
      <h1>Cabin Visits</h1>
      {visits && visits.length > 0 ? (
        <table className="visits-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Visitors</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(visit => (
              <tr key={visit.id}>
                <td>{visit.name}</td>
                <td>{formatDate(visit.startDate)}</td>
                <td>{formatDate(visit.endDate)}</td>
                <td>{visit.visitors.map(v => v.name).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No visits recorded for this cabin.</p>
      )}
    </div>
  );
};

export default VisitsPage;
