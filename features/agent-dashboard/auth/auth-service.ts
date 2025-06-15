// Authentication Service - Complete authentication and authorization system
// Role-based access control as specified in agent_dashboard_plan.md

import { EventEmitter } from 'events';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  DashboardError,
  PermissionProfile,
  Permission
} from '../types/index.js';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  permissions: Permission[];
  profile: PermissionProfile;
  lastLogin?: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
  permissions: Permission[];
  profile: PermissionProfile;
  iat?: number;
  exp?: number;
}

export class AuthenticationService extends EventEmitter {
  private config: Required<AuthConfig>;
  private prisma: PrismaClient;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  
  constructor(config: Partial<AuthConfig> = {}, prisma?: PrismaClient) {
    super();
    
    this.config = {
      jwtSecret: config.jwtSecret ?? process.env.JWT_SECRET ?? this.generateSecretKey(),
      jwtExpiresIn: config.jwtExpiresIn ?? '24h',
      bcryptRounds: config.bcryptRounds ?? 12,
      sessionTimeout: config.sessionTimeout ?? 24 * 60 * 60 * 1000, // 24 hours
      maxLoginAttempts: config.maxLoginAttempts ?? 5,
      lockoutDuration: config.lockoutDuration ?? 15 * 60 * 1000, // 15 minutes
      passwordMinLength: config.passwordMinLength ?? 8,
      requireEmailVerification: config.requireEmailVerification ?? false
    };
    
    this.prisma = prisma ?? new PrismaClient();
  }
  
  public async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing Authentication Service...');
      
      // Test database connection
      await this.prisma.$connect();
      
      // Create default admin user if none exists
      await this.createDefaultAdmin();
      
      // Start cleanup routines
      this.startCleanupTasks();
      
      console.log('✅ Authentication Service initialized successfully');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize Authentication Service:', message);
      throw new DashboardError(`Authentication initialization failed: ${message}`, 'AUTH_INIT_ERROR');
    }
  }
  
  private async createDefaultAdmin(): Promise<void> {
    try {
      const adminExists = await this.prisma.user.findFirst({
        where: { email: 'admin@dashboard.local' }
      });
      
      if (!adminExists) {
        const defaultPassword = process.env.ADMIN_PASSWORD ?? 'admin123!@#';
        
        await this.register({
          email: 'admin@dashboard.local',
          username: 'admin',
          password: defaultPassword,
          firstName: 'System',
          lastName: 'Administrator'
        });
        
        console.log('👤 Default admin user created: admin@dashboard.local');
        console.log('🔑 Default password:', defaultPassword);
        console.log('⚠️ Please change the default password immediately!');
      }
    } catch (error) {
      console.warn('⚠️ Could not create default admin user:', error);
    }
  }
  
  private startCleanupTasks(): void {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        const result = await this.prisma.userSession.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: new Date() } },
              { isActive: false }
            ]
          }
        });
        
        if (result.count > 0) {
          console.log(`🧹 Cleaned up ${result.count} expired sessions`);
        }
      } catch (error) {
        console.error('❌ Session cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    // Clear login attempts every 30 minutes
    setInterval(() => {
      const now = new Date();
      for (const [key, attempt] of this.loginAttempts.entries()) {
        if (now.getTime() - attempt.lastAttempt.getTime() > this.config.lockoutDuration) {
          this.loginAttempts.delete(key);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
  
  // === REGISTRATION ===
  
  public async register(data: RegisterData): Promise<AuthenticatedUser> {
    try {
      // Validate input
      this.validateRegistrationData(data);
      
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { username: data.username }
          ]
        }
      });
      
      if (existingUser) {
        throw new DashboardError('User already exists with this email or username', 'USER_EXISTS');
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(this.config.bcryptRounds);
      const passwordHash = await bcrypt.hash(data.password, salt);
      
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          salt,
          isActive: true,
          isVerified: !this.config.requireEmailVerification
        }
      });
      
      // Create default dashboard
      await this.createDefaultDashboard(user.id);
      
      // Log registration
      await this.logAuditEvent('user.registered', user.id, {
        email: data.email,
        username: data.username
      });
      
      this.emit('user:registered', { userId: user.id, email: data.email });
      
      return this.mapToAuthenticatedUser(user);
      
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DashboardError(`Registration failed: ${message}`, 'REGISTRATION_ERROR');
    }
  }
  
  private validateRegistrationData(data: RegisterData): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new DashboardError('Valid email is required', 'INVALID_EMAIL');
    }
    
    if (!data.username || data.username.length < 3) {
      throw new DashboardError('Username must be at least 3 characters', 'INVALID_USERNAME');
    }
    
    if (!data.password || data.password.length < this.config.passwordMinLength) {
      throw new DashboardError(`Password must be at least ${this.config.passwordMinLength} characters`, 'INVALID_PASSWORD');
    }
    
    if (!this.isStrongPassword(data.password)) {
      throw new DashboardError('Password must contain uppercase, lowercase, number, and special character', 'WEAK_PASSWORD');
    }
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private isStrongPassword(password: string): boolean {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }
  
  private async createDefaultDashboard(userId: string): Promise<void> {
    await this.prisma.dashboard.create({
      data: {
        name: 'My Dashboard',
        description: 'Default dashboard for new user',
        config: {
          layout: 'grid',
          widgets: ['claude-interface', 'workflow-builder', 'realtime-monitor'],
          theme: 'dark'
        },
        userId
      }
    });
  }
  
  // === LOGIN ===
  
  public async login(credentials: LoginCredentials): Promise<{ user: AuthenticatedUser; token: string; session: UserSession }> {
    try {
      // Check for account lockout
      this.checkAccountLockout(credentials.email);
      
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email }
      });
      
      if (!user) {
        this.recordFailedLogin(credentials.email);
        throw new DashboardError('Invalid credentials', 'INVALID_CREDENTIALS');
      }
      
      // Check if user is active
      if (!user.isActive) {
        throw new DashboardError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
      
      if (!isValidPassword) {
        this.recordFailedLogin(credentials.email);
        throw new DashboardError('Invalid credentials', 'INVALID_CREDENTIALS');
      }
      
      // Clear failed login attempts
      this.loginAttempts.delete(credentials.email);
      
      // Create session
      const session = await this.createUserSession(user.id, credentials.userAgent, credentials.ipAddress);
      
      // Generate JWT token
      const token = await this.generateJWTToken(user.id, session.id);
      
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      
      // Log login
      await this.logAuditEvent('user.login', user.id, {
        sessionId: session.id,
        userAgent: credentials.userAgent,
        ipAddress: credentials.ipAddress
      });
      
      this.emit('user:login', { userId: user.id, sessionId: session.id });
      
      return {
        user: this.mapToAuthenticatedUser(user),
        token,
        session
      };
      
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DashboardError(`Login failed: ${message}`, 'LOGIN_ERROR');
    }
  }
  
  private checkAccountLockout(email: string): void {
    const attempts = this.loginAttempts.get(email);
    if (attempts && attempts.count >= this.config.maxLoginAttempts) {
      const lockoutEnd = new Date(attempts.lastAttempt.getTime() + this.config.lockoutDuration);
      if (new Date() < lockoutEnd) {
        throw new DashboardError('Account temporarily locked due to too many failed attempts', 'ACCOUNT_LOCKED');
      }
    }
  }
  
  private recordFailedLogin(email: string): void {
    const current = this.loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    this.loginAttempts.set(email, {
      count: current.count + 1,
      lastAttempt: new Date()
    });
  }
  
  private async createUserSession(userId: string, userAgent?: string, ipAddress?: string): Promise<UserSession> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + this.config.sessionTimeout);
    
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        token: sessionToken,
        userAgent,
        ipAddress,
        expiresAt,
        isActive: true
      }
    });
    
    return session;
  }
  
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  private async generateJWTToken(userId: string, sessionId: string): Promise<string> {
    // Get user permissions and profile
    const user = await this.getUserWithPermissions(userId);
    
    const payload: JWTPayload = {
      userId,
      sessionId,
      permissions: user.permissions,
      profile: user.profile
    };
    
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn
    });
  }
  
  private async getUserWithPermissions(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new DashboardError('User not found', 'USER_NOT_FOUND');
    }
    
    return this.mapToAuthenticatedUser(user);
  }
  
  // === TOKEN VALIDATION ===
  
  public async validateToken(token: string): Promise<AuthenticatedUser> {
    try {
      // Verify JWT
      const payload = jwt.verify(token, this.config.jwtSecret) as JWTPayload;
      
      // Check session validity
      const session = await this.prisma.userSession.findUnique({
        where: { id: payload.sessionId },
        include: { user: true }
      });
      
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new DashboardError('Invalid or expired session', 'INVALID_SESSION');
      }
      
      if (!session.user.isActive) {
        throw new DashboardError('User account is deactivated', 'ACCOUNT_DEACTIVATED');
      }
      
      // Update session activity
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() }
      });
      
      return this.mapToAuthenticatedUser(session.user);
      
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new DashboardError('Invalid token', 'INVALID_TOKEN');
      }
      if (error instanceof DashboardError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DashboardError(`Token validation failed: ${message}`, 'TOKEN_VALIDATION_ERROR');
    }
  }
  
  // === LOGOUT ===
  
  public async logout(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as JWTPayload;
      
      // Deactivate session
      await this.prisma.userSession.update({
        where: { id: payload.sessionId },
        data: { isActive: false }
      });
      
      // Log logout
      await this.logAuditEvent('user.logout', payload.userId, {
        sessionId: payload.sessionId
      });
      
      this.emit('user:logout', { userId: payload.userId, sessionId: payload.sessionId });
      
    } catch (error) {
      // Silently fail for logout - token might already be invalid
      console.warn('Logout warning:', error);
    }
  }
  
  // === PASSWORD MANAGEMENT ===
  
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Validate new password
      if (!newPassword || newPassword.length < this.config.passwordMinLength) {
        throw new DashboardError(`Password must be at least ${this.config.passwordMinLength} characters`, 'INVALID_PASSWORD');
      }
      
      if (!this.isStrongPassword(newPassword)) {
        throw new DashboardError('Password must contain uppercase, lowercase, number, and special character', 'WEAK_PASSWORD');
      }
      
      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new DashboardError('User not found', 'USER_NOT_FOUND');
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isValidPassword) {
        throw new DashboardError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(this.config.bcryptRounds);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, salt }
      });
      
      // Invalidate all user sessions except current one (force re-login)
      await this.prisma.userSession.updateMany({
        where: { userId },
        data: { isActive: false }
      });
      
      // Log password change
      await this.logAuditEvent('user.password_changed', userId, {});
      
      this.emit('user:password_changed', { userId });
      
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DashboardError(`Password change failed: ${message}`, 'PASSWORD_CHANGE_ERROR');
    }
  }
  
  // === UTILITIES ===
  
  private mapToAuthenticatedUser(user: any): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isActive: user.isActive,
      isVerified: user.isVerified,
      permissions: this.getUserPermissions(user), // Based on user role/profile
      profile: this.getUserProfile(user), // Based on user role
      lastLogin: user.lastLogin
    };
  }
  
  private getUserPermissions(user: any): Permission[] {
    // Default permissions for authenticated users
    const basePermissions: Permission[] = [
      'read-codebase',
      'write-code',
      'create-files',
      'run-tests',
      'read-docs',
      'write-docs'
    ];
    
    // Admin users get all permissions
    if (user.email === 'admin@dashboard.local') {
      return [
        ...basePermissions,
        'read-all',
        'write-all',
        'delete-files',
        'commit-changes',
        'deploy',
        'rollback',
        'analyze-performance',
        'modify-config',
        'restart-services'
      ];
    }
    
    return basePermissions;
  }
  
  private getUserProfile(user: any): PermissionProfile {
    // Admin gets trusted-developer profile
    if (user.email === 'admin@dashboard.local') {
      return 'trusted-developer';
    }
    
    // Default profile for regular users
    return 'code-reviewer';
  }
  
  private async logAuditEvent(action: string, userId: string, data: any): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          userId,
          data,
          success: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
  
  private generateSecretKey(): string {
    return crypto.randomBytes(64).toString('hex');
  }
  
  // === PUBLIC API ===
  
  public async getUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    
    return user ? this.mapToAuthenticatedUser(user) : null;
  }
  
  public async getActiveSessionsCount(userId: string): Promise<number> {
    return this.prisma.userSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });
  }
  
  public async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false }
    });
    
    this.emit('user:sessions_revoked', { userId });
  }
  
  // === CLEANUP ===
  
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Authentication Service...');
    
    await this.prisma.$disconnect();
    this.loginAttempts.clear();
    
    console.log('✅ Authentication Service shutdown complete');
  }
}

export default AuthenticationService;