'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading, error };
}

export function useCaptains() {
  const { users, loading, error } = useUsers();
  
  const captains = users.filter(user => 
    user.roles.includes('captain')
  );

  return { captains, loading, error };
}

export function useEmployees() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  return { employees, loading, error };
}
