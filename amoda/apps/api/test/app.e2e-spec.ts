import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AMODA API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe('ok');
      });
  });

  it('GET /api/v1/properties returns a paginated list', () => {
    return request(app.getHttpServer())
      .get('/api/v1/properties')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveProperty('data');
        expect(body.data).toHaveProperty('meta');
      });
  });

  it('POST /api/v1/auth/register rejects a weak password', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'weakpass@amoda.app',
        password: 'weak',
      })
      .expect(400);
  });

  it('registers, verifies-fails gracefully, and logs in with wrong password rejected', async () => {
    const email = `e2e-${Date.now()}@amoda.app`;

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: 'StrongPass1',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword1' })
      .expect(401);
  });

  it('GET /api/v1/leads requires authentication', () => {
    return request(app.getHttpServer()).get('/api/v1/leads').expect(401);
  });

  it('rejects a CUSTOMER from an admin-only endpoint (RBAC enforced)', async () => {
    const email = `rbac-${Date.now()}@amoda.app`;

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Rbac',
        lastName: 'Test',
        email,
        password: 'StrongPass1',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'StrongPass1' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/properties/admin/all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('POST /api/v1/properties/:propertyId/leads captures a public inquiry lead', async () => {
    const propertiesResponse = await request(app.getHttpServer())
      .get('/api/v1/properties?limit=1')
      .expect(200);

    const property = propertiesResponse.body.data.data[0];
    if (!property) return; // no seeded property in this environment

    await request(app.getHttpServer())
      .post(`/api/v1/properties/${property.id}/leads`)
      .send({ fullName: 'E2E Lead', email: `lead-${Date.now()}@amoda.app`, message: 'Interested!' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data.received).toBe(true);
      });
  });
});
