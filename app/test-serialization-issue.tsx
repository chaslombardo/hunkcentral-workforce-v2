'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  rateMoveWingman: number;
}

const mockUserWithDecimals: User = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['captain'],
  rateMoveWingman: 15.5,
};

export default function TestSerializationPage() {
  const [testUser, setTestUser] = useState<User | null>(null);

  return (
    <div>
      <h2>User Details Test</h2>
      <pre>Current User Object:</pre>
      <pre>{JSON.stringify(testUser || mockUserWithDecimals, null, 2)}</pre>

      <button onClick={() => setTestUser(mockUserWithDecimals)}>
        Test Serialization
      </button>
    </div>
  );
}
