import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; // Standard routing hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisitsByCabin, createVisit } from '../api/visitApi';
import { getVisitorsByCabin, createVisitor } from '../api/visitorApi';
import type { Visitor } from '../types/visitor';
import type { CreateVisitRequest } from '../types/visit';
import './VisitsPage.css';

type PartialVisitorPeriod = {
  startDate: string;
  endDate: string;
};

type PartialVisitorForm = {
  id?: number;
  name: string;
  search: string;
  showDropdown: boolean;
  visitPeriods: PartialVisitorPeriod[];
};

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
  const [showPartialVisitorSection, setShowPartialVisitorSection] = useState(false);
  const [partialVisitors, setPartialVisitors] = useState<PartialVisitorForm[]>([]);
  const partialStartRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

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
    onSuccess: () => {
      // Clear full-time search UI and refresh cache; selection is handled by caller
      setVisitorSearch('');
      setShowVisitorDropdown(false);
      // Invalidate the visitors query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['visitors', cabinId] });
    },
    onError: (error) => {
      console.error('Error creating visitor:', error);
      showToast('Failed to create visitor. Please try again.', 'error');
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
      setPartialVisitors([]);
      setShowPartialVisitorSection(false);
      setIsSameDayVisit(false);
    },
    onError: (error) => {
      console.error('Error creating visit:', error);
      showToast('Failed to create visit. Please try again.', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill in all fields');
      return;
    }

    const incompletePartialVisitor = partialVisitors.some(pv => !pv.id || pv.visitPeriods.some(period => !period.startDate || !period.endDate));
    if (incompletePartialVisitor) {
      alert('Please complete all partial visitor details or remove the incomplete entry.');
      return;
    }

    const formattedPartialVisitors = partialVisitors.map(pv => ({
      id: pv.id!,
      visitPeriods: pv.visitPeriods.map(period => ({
        startDate: period.startDate,
        endDate: period.endDate,
      })),
    }));

    const visitData: CreateVisitRequest = {
      ...formData,
      visitors: {
        fullTimeVisitorIds: selectedVisitors.map(v => v.id),
        ...(formattedPartialVisitors.length > 0 ? { partialVisitors: formattedPartialVisitors } : {}),
      },
    };

    createVisitMutation.mutate(visitData);
  };

  const updatePartialVisitor = (index: number, updated: Partial<PartialVisitorForm>) => {
    setPartialVisitors(prev => prev.map((pv, pvIndex) => pvIndex === index ? { ...pv, ...updated } : pv));
  };

  const addPartialVisitor = () => {
    setPartialVisitors(prev => [
      ...prev,
      {
        id: undefined,
        name: '',
        search: '',
        showDropdown: false,
        visitPeriods: [{ startDate: '', endDate: '' }],
      }
    ]);
    setShowPartialVisitorSection(true);
  };

  const removePartialVisitor = (index: number) => {
    setPartialVisitors(prev => prev.filter((_, pvIndex) => pvIndex !== index));
  };

  const addPartialPeriod = (index: number) => {
    setPartialVisitors(prev => prev.map((pv, pvIndex) => pvIndex === index ? {
      ...pv,
      visitPeriods: [...pv.visitPeriods, { startDate: '', endDate: '' }],
    } : pv));
  };

  const removePartialPeriod = (visitorIndex: number, periodIndex: number) => {
    setPartialVisitors(prev => prev.map((pv, pvIndex) => pvIndex === visitorIndex ? {
      ...pv,
      visitPeriods: pv.visitPeriods.filter((_, idx) => idx !== periodIndex),
    } : pv));
  };

  const getPartialVisitorOptions = (currentIndex: number) => {
    const search = partialVisitors[currentIndex].search.toLowerCase();
    return visitors.filter(visitor =>
      visitor.name.toLowerCase().includes(search) &&
      !selectedVisitors.some(v => v.id === visitor.id) &&
      !partialVisitors.some((pv, idx) => idx !== currentIndex && pv.id === visitor.id)
    );
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
      const name = visitorSearch.trim();
      createVisitorMutation.mutate({ name }, {
        onSuccess: (newVisitor: Visitor) => {
          setSelectedVisitors(prev => [...prev, newVisitor]);
          setVisitorSearch('');
          setShowVisitorDropdown(false);
          queryClient.invalidateQueries({ queryKey: ['visitors', cabinId] });
          showToast(`Created visitor "${newVisitor.name}"`, 'success');
        },
        onError: () => {
          showToast('Failed to create visitor. Please try again.', 'error');
        }
      });
    }
  };

  const handlePartialVisitorSearchChange = (index: number, value: string) => {
    updatePartialVisitor(index, { search: value, showDropdown: true, name: '' });
  };

  const handlePartialVisitorSelect = (index: number, visitor: Visitor) => {
    updatePartialVisitor(index, {
      id: visitor.id,
      name: visitor.name,
      search: visitor.name,
      showDropdown: false,
    });
  };

  const handleCreateNewPartialVisitor = (index: number) => {
    const name = partialVisitors[index]?.search?.trim();
    if (!name) return;
    createVisitorMutation.mutate({ name }, {
      onSuccess: (newVisitor: Visitor) => {
        updatePartialVisitor(index, {
          id: newVisitor.id,
          name: newVisitor.name,
          search: newVisitor.name,
          showDropdown: false,
        });
        queryClient.invalidateQueries({ queryKey: ['visitors', cabinId] });
        showToast(`Created visitor "${newVisitor.name}"`, 'success');
        // focus the first start date input for this partial visitor
        window.setTimeout(() => partialStartRefs.current[index]?.focus(), 50);
      },
      onError: (error) => {
        console.error('Error creating partial visitor:', error);
        showToast('Failed to create visitor. Please try again.', 'error');
      }
    });
  };

  const handlePartialSearchBlur = (index: number) => {
    setTimeout(() => updatePartialVisitor(index, { showDropdown: false }), 150);
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
      {toast && (
        <div className={`toast ${toast.type ? toast.type : ''}`}>{toast.message}</div>
      )}
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

          <div className="form-group">
            <button
              type="button"
              className="collapse-toggle"
              onClick={() => setShowPartialVisitorSection(prev => !prev)}
            >
              {showPartialVisitorSection
                ? 'Hide optional partial visitor details'
                : 'Add optional partial visitor details'}
            </button>
          </div>

          {showPartialVisitorSection && (
            <div className="partial-section">
              <p className="optional-note">
                Optional: use this for visitors who attended only part of the visit.
              </p>
              {partialVisitors.map((partial, index) => {
                const partialOptions = getPartialVisitorOptions(index);
                return (
                  <div key={index} className="partial-visitor-card">
                    <div className="partial-header">
                      <span>Partial visitor {index + 1}</span>
                      <button
                        type="button"
                        className="remove-partial-btn"
                        onClick={() => removePartialVisitor(index)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`partialVisitor-${index}`}>Visitor:</label>
                      <div className="visitor-search-container">
                        <input
                          type="text"
                          id={`partialVisitor-${index}`}
                          value={partial.search}
                          onChange={e => handlePartialVisitorSearchChange(index, e.target.value)}
                          onFocus={() => updatePartialVisitor(index, { showDropdown: true })}
                          onBlur={() => handlePartialSearchBlur(index)}
                          placeholder="Search visitors..."
                          className="visitor-search-input"
                        />
                        {partial.showDropdown && (partialOptions.length > 0 || (partial.search && partial.search.trim())) && (
                          <div className="visitor-dropdown">
                            {partialOptions.slice(0, 10).map(visitor => (
                              <div
                                key={visitor.id}
                                className="visitor-option"
                                onClick={() => handlePartialVisitorSelect(index, visitor)}
                              >
                                {visitor.name}
                              </div>
                            ))}
                            {partial.search && partial.search.trim() && !partialOptions.some(v => v.name.toLowerCase() === partial.search.toLowerCase().trim()) && (
                              <div
                                className="visitor-option create-option"
                                onClick={() => handleCreateNewPartialVisitor(index)}
                              >
                                + Create "{partial.search.trim()}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {partial.visitPeriods.map((period, periodIndex) => (
                      <div key={periodIndex} className="partial-period-row">
                        <div className="form-group">
                          <label htmlFor={`partialStart-${index}-${periodIndex}`}>Start:</label>
                          <input
                            type="date"
                            id={`partialStart-${index}-${periodIndex}`}
                            value={period.startDate}
                              onChange={e => {
                              const value = e.target.value;
                              setPartialVisitors(prev =>
                                prev.map((pv, pvIndex) =>
                                  pvIndex === index
                                    ? {
                                        ...pv,
                                        visitPeriods: pv.visitPeriods.map((p, idx) =>
                                          idx === periodIndex ? { ...p, startDate: value } : p
                                        ),
                                      }
                                    : pv
                                )
                              );
                            }}
                              ref={el => {
                                // attach ref for the first period's start input for autofocus
                                if (periodIndex === 0) partialStartRefs.current[index] = el;
                              }}
                              required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`partialEnd-${index}-${periodIndex}`}>End:</label>
                          <input
                            type="date"
                            id={`partialEnd-${index}-${periodIndex}`}
                            value={period.endDate}
                            onChange={e => {
                              const value = e.target.value;
                              setPartialVisitors(prev =>
                                prev.map((pv, pvIndex) =>
                                  pvIndex === index
                                    ? {
                                        ...pv,
                                        visitPeriods: pv.visitPeriods.map((p, idx) =>
                                          idx === periodIndex ? { ...p, endDate: value } : p
                                        ),
                                      }
                                    : pv
                                )
                              );
                            }}
                            required
                          />
                        </div>
                        <button
                          type="button"
                          className="remove-period-btn"
                          onClick={() => removePartialPeriod(index, periodIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => addPartialPeriod(index)}
                    >
                      Add another period
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="secondary-btn"
                onClick={addPartialVisitor}
              >
                Add partial visitor
              </button>
            </div>
          )}

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
