import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../src/routes/auth.routes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@events.local',
          password: 'ADMINCONTROL123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'admin@events.local');
      expect(response.body.user).toHaveProperty('first_name', 'System');
      expect(response.body.user).toHaveProperty('last_name', 'Admin');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('ADMIN');

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.startsWith('access='))).toBe(true);
    });

    it('should login successfully with valid attendee credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'attendee1@mail.local',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'attendee1@mail.local');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('ATTENDEE');
    });

    it('should login successfully with valid organizer credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'olivia@org1.local',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'olivia@org1.local');
      expect(response.body.user).toHaveProperty('first_name', 'Olivia');
      expect(response.body.user).toHaveProperty('last_name', 'Ray');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('ORGANIZER');
    });

    it('should login successfully with valid vendor credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'vendor1@org1.local',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'vendor1@org1.local');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('VENDOR');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@events.local',
          password: 'wrongpassword',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@events.local',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const randomEmail = `test_${Date.now()}@example.com`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: randomEmail,
          password: 'newpassword123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', randomEmail);
      expect(response.body.user).toHaveProperty('first_name', 'Test');
      expect(response.body.user).toHaveProperty('last_name', 'User');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('ATTENDEE'); // Auto-assigned ATTENDEE role

      // Check that auth cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.startsWith('access='))).toBe(true);
    });

    it('should fail to register with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@events.local', // Already exists from seed
          password: 'password123',
          first_name: 'Duplicate',
          last_name: 'User',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@events.local',
          password: 'ADMINCONTROL123',
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then get profile
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@events.local');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('ADMIN');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'attendee1@mail.local',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(204);

      // Check that cookie was cleared (clearCookie sets an expired cookie)
      const logoutCookies = response.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
      // Cookie should be cleared (either with Max-Age=0 or Expires in the past)
      expect(logoutCookies.some(cookie =>
        cookie.startsWith('access=')
      )).toBe(true);
    });
  });
});
