import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // Standard routing hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisitsByCabin, createVisit } from '../api/visitApi';
import { getVisitorsByCabin, createVisitor } from '../api/visitorApi';
import type { Visitor } from '../types/visitor';
import type { CreateVisitRequest } from '../types/visit';
import './VisitsPage.css';

const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
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
  const [isSameDayVisit, setIsSameDayVisit] = useState(false);
  const [selectedVisitors, setSelectedVisitors] = useState<Visitor[]>([]);
  const [visitorSearch, setVisitorSearch] = useState('');
  const [showVisitorDropdown, setShowVisitorDropdown] = useState(false);

  const { data: visits, isLoading, error } = useQuery({
    // Include cabinId in the key so the query is unique per cabin!
    queryKey: ['visits', cabinId], 
    queryFn: () => getVisitsByCabin(cabinId!),
    enabled: !!cabinId, // Only run if we actually have an ID
  });

  const { data: visitors = [] } = useQuery({
    queryKey: ['visitors', cabinId],
    queryFn: () => getVisitorsByCabin(cabinId!),
    enabled: !!cabinId,
  });

  const createVisitorMutation = useMutation({
    mutationFn: (visitorData: { name: string }) =>
      createVisitor(cabinId!, visitorData),
    onSuccess: (newVisitor: Visitor) => {
      // Add the new visitor to the selected visitors
      setSelectedVisitors(prev => [...prev, newVisitor]);
      setVisitorSearch('');
      setShowVisitorDropdown(false);
      // Invalidate the visitors query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['visitors', cabinId] });
    },
    onError: (error) => {
      console.error('Error creating visitor:', error);
      alert('Failed to create visitor. Please try again.');
    }
  });

  const createVisitMutation = useMutation({
    mutationFn: (visitData: CreateVisitRequest) =>
      createVisit(cabinId!, visitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', cabinId] });
      setShowForm(false);
      setFormData({ name: '', startDate: '', endDate: '' });
      setSelectedVisitors([]);
      setVisitorSearch('');
      setIsSameDayVisit(false);
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
    const visitData = {
      ...formData,
      visitors: {
        fullTimeVisitorIds: selectedVisitors.map(v => v.id)
      }
    };
    createVisitMutation.mutate(visitData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // If start date changed and same-day visit is enabled, update end date
      if (name === 'startDate' && isSameDayVisit) {
        updated.endDate = value;
      }
      return updated;
    });
  };

  const handleSameDayVisitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsSameDayVisit(isChecked);
    if (isChecked && formData.startDate) {
      // When checking, set end date to match start date
      setFormData(prev => ({ ...prev, endDate: prev.startDate }));
    }
  };

  const handleVisitorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVisitorSearch(e.target.value);
    setShowVisitorDropdown(true);
  };

  const handleVisitorSelect = (visitor: Visitor) => {
    if (!selectedVisitors.find(v => v.id === visitor.id)) {
      setSelectedVisitors([...selectedVisitors, visitor]);
    }
    setVisitorSearch('');
    setShowVisitorDropdown(false);
  };

  const handleCreateNewVisitor = () => {
    if (visitorSearch.trim()) {
      createVisitorMutation.mutate({ name: visitorSearch.trim() });
    }
  };

  const handleVisitorRemove = (visitorId: number) => {
    setSelectedVisitors(selectedVisitors.filter(v => v.id !== visitorId));
  };

  const handleVisitorSearchBlur = () => {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => setShowVisitorDropdown(false), 150);
  };

  const filteredVisitors = visitors.filter(visitor =>
    visitor.name.toLowerCase().includes(visitorSearch.toLowerCase()) &&
    !selectedVisitors.find(v => v.id === visitor.id)
  );

  const showCreateOption = visitorSearch.trim() && !filteredVisitors.some(v => 
    v.name.toLowerCase() === visitorSearch.toLowerCase().trim()
  );

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
              disabled={isSameDayVisit}
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="sameDayVisit"
              checked={isSameDayVisit}
              onChange={handleSameDayVisitChange}
            />
            <label htmlFor="sameDayVisit">Same day visit</label>
          </div>

          <div className="form-group">
            <label>Full-time Visitors:</label>
            <div className="visitor-selector">
              <div className="selected-visitors">
                {selectedVisitors.map(visitor => (
                  <span key={visitor.id} className="visitor-chip">
                    {visitor.name}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => handleVisitorRemove(visitor.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="visitor-search-container">
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={visitorSearch}
                  onChange={handleVisitorSearchChange}
                  onFocus={() => setShowVisitorDropdown(true)}
                  onBlur={handleVisitorSearchBlur}
                  className="visitor-search-input"
                />
                {showVisitorDropdown && (filteredVisitors.length > 0 || showCreateOption) && (
                  <div className="visitor-dropdown">
                    {filteredVisitors.slice(0, 10).map(visitor => (
                      <div
                        key={visitor.id}
                        className="visitor-option"
                        onClick={() => handleVisitorSelect(visitor)}
                      >
                        {visitor.name}
                      </div>
                    ))}
                    {showCreateOption && (
                      <div
                        className="visitor-option create-option"
                        onClick={handleCreateNewVisitor}
                      >
                        + Create "{visitorSearch.trim()}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
