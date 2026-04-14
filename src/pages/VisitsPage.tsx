import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // Standard routing hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisitsByCabin, createVisit } from '../api/visitApi';
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
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  const { data: visits, isLoading, error } = useQuery({
    // Include cabinId in the key so the query is unique per cabin!
    queryKey: ['visits', cabinId], 
    queryFn: () => getVisitsByCabin(cabinId!),
    enabled: !!cabinId, // Only run if we actually have an ID
  });

  const createVisitMutation = useMutation({
    mutationFn: (visitData: { name: string; startDate: string; endDate: string }) =>
      createVisit(cabinId!, visitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', cabinId] });
      setShowForm(false);
      setFormData({ name: '', startDate: '', endDate: '' });
    },
    onError: (error) => {
      console.error('Error creating visit:', error);
      alert('Failed to create visit. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill in all fields');
      return;
    }
    createVisitMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModalBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowForm(false);
    }
  };

  if (isLoading) return <div>Loading visits for Cabin {cabinId}...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="visits-container">
      <h1>Cabin Visits</h1>
      <button
        className="add-visit-btn"
        onClick={() => setShowForm(!showForm)}
      >
        Add New Visit
      </button>

      {showForm && (
        <div className="modal-backdrop" onClick={handleModalBackdropClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Visit</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowForm(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <form className="visit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Visit Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Summer 2024"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={createVisitMutation.isPending}
          >
            {createVisitMutation.isPending ? 'Creating...' : 'Create Visit'}
          </button>
            </form>
          </div>
        </div>
      )}

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
