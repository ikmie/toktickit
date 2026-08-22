import React, { createContext, useContext, useState, useEffect } from 'react';

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
}

interface RequesterContextType {
  requesters: RequesterUser[];
  selectedRequester: RequesterUser | null;
  selectRequester: (requesterId: number) => void;
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [selectedRequester, setSelectedRequester] = useState<RequesterUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchRequesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/requesters');
      if (!response.ok) {
        throw new Error('Failed to load development requesters');
      }
      const data: RequesterUser[] = await response.json();
      setRequesters(data);

      const savedIdStr = localStorage.getItem('toktickit_requester_id');
      const savedId = savedIdStr ? parseInt(savedIdStr, 10) : null;

      if (savedId) {
        const found = data.find((r) => r.id === savedId);
        if (found) {
          setSelectedRequester(found);
        } else if (data.length > 0) {
          setSelectedRequester(data[0]);
          localStorage.setItem('toktickit_requester_id', data[0].id.toString());
        }
      } else if (data.length > 0) {
        setSelectedRequester(data[0]);
        localStorage.setItem('toktickit_requester_id', data[0].id.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequesters();
  }, []);

  const selectRequester = (requesterId: number) => {
    const target = requesters.find((r) => r.id === requesterId);
    if (target) {
      setSelectedRequester(target);
      localStorage.setItem('toktickit_requester_id', target.id.toString());
    }
  };

  return (
    <RequesterContext.Provider
      value={{
        requesters,
        selectedRequester,
        selectRequester,
        loading,
        error,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
};

export const useRequester = () => {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error('useRequester must be used within a RequesterProvider');
  }
  return context;
};
