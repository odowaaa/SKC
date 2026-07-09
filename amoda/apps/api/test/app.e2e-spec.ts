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
});
