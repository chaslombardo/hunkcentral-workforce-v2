import { 
  canManagerAccessUser, 
  getManagerAccessibleRoles, 
  shouldFilterUsersForManager,
  canUserAccessUserData 
} from '@/lib/auth';
import type { User, UserRole } from '@/types';

// Mock user factory
const createMockUser = (id: string, roles: UserRole[]): User => ({
  id,
  email: `${id}@test.com`,
  fullName: `Test User ${id}`,
  roles,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Manager Access Control', () => {
  describe('getManagerAccessibleRoles', () => {
    it('should return captain and wingman roles', () => {
      const accessibleRoles = getManagerAccessibleRoles();
      expect(accessibleRoles).toEqual(['captain', 'wingman']);
    });
  });

  describe('canManagerAccessUser', () => {
    const adminUser = createMockUser('admin1', ['admin']);
    const managerUser = createMockUser('manager1', ['manager']);
    const captainUser = createMockUser('captain1', ['captain']);
    const wingmanUser = createMockUser('wingman1', ['wingman']);
    const salesUser = createMockUser('sales1', ['sales']);
    const mixedRoleUser = createMockUser('mixed1', ['captain', 'sales']);

    it('should allow admin to access any user', () => {
      expect(canManagerAccessUser(adminUser, captainUser)).toBe(true);
      expect(canManagerAccessUser(adminUser, wingmanUser)).toBe(true);
      expect(canManagerAccessUser(adminUser, salesUser)).toBe(true);
      expect(canManagerAccessUser(adminUser, managerUser)).toBe(true);
    });

    it('should allow manager to access captain users', () => {
      expect(canManagerAccessUser(managerUser, captainUser)).toBe(true);
    });

    it('should allow manager to access wingman users', () => {
      expect(canManagerAccessUser(managerUser, wingmanUser)).toBe(true);
    });

    it('should allow manager to access users with mixed roles including captain/wingman', () => {
      expect(canManagerAccessUser(managerUser, mixedRoleUser)).toBe(true);
    });

    it('should not allow manager to access sales users', () => {
      expect(canManagerAccessUser(managerUser, salesUser)).toBe(false);
    });

    it('should not allow manager to access other managers', () => {
      const otherManager = createMockUser('manager2', ['manager']);
      expect(canManagerAccessUser(managerUser, otherManager)).toBe(false);
    });

    it('should allow users to access themselves', () => {
      expect(canManagerAccessUser(salesUser, salesUser)).toBe(true);
      expect(canManagerAccessUser(managerUser, managerUser)).toBe(true);
    });
  });

  describe('shouldFilterUsersForManager', () => {
    it('should return true for manager-only users', () => {
      const managerUser = createMockUser('manager1', ['manager']);
      expect(shouldFilterUsersForManager(managerUser)).toBe(true);
    });

    it('should return false for admin users', () => {
      const adminUser = createMockUser('admin1', ['admin']);
      expect(shouldFilterUsersForManager(adminUser)).toBe(false);
    });

    it('should return false for admin-manager users', () => {
      const adminManagerUser = createMockUser('adminmanager1', ['admin', 'manager']);
      expect(shouldFilterUsersForManager(adminManagerUser)).toBe(false);
    });

    it('should return false for non-manager users', () => {
      const captainUser = createMockUser('captain1', ['captain']);
      expect(shouldFilterUsersForManager(captainUser)).toBe(false);
    });
  });

  describe('canUserAccessUserData', () => {
    const adminUser = createMockUser('admin1', ['admin']);
    const managerUser = createMockUser('manager1', ['manager']);
    const captainUser = createMockUser('captain1', ['captain']);

    it('should allow admin to access any user data', () => {
      expect(canUserAccessUserData(adminUser, 'any-user-id')).toBe(true);
    });

    it('should allow users to access their own data', () => {
      expect(canUserAccessUserData(captainUser, captainUser.id)).toBe(true);
    });

    it('should allow managers to access user data (filtering happens at query level)', () => {
      expect(canUserAccessUserData(managerUser, 'some-user-id')).toBe(true);
    });

    it('should not allow non-admin, non-manager users to access other user data', () => {
      expect(canUserAccessUserData(captainUser, 'other-user-id')).toBe(false);
    });
  });
});