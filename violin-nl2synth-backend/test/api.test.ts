import request from 'supertest';
import app from '../src/app';

describe('Violin NL2Synth Backend API', () => {
  it('POST /translate should return notes array', async () => {
    const res = await request(app)
      .post('/translate')
      .send({ description: '演奏一段溫柔的小提琴旋律' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('pitch');
  });

  it('POST /parametrize should return mapped synth params', async () => {
    const notes = [{ pitch: 69, duration: 1, velocity: 80 }];
    const res = await request(app)
      .post('/parametrize')
      .send(notes);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('intensity');
  });

  it('POST /play should return playing status', async () => {
    const notes = [{ pitch: 69, duration: 1, velocity: 80 }];
    const res = await request(app)
      .post('/play')
      .send(notes);
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
  });

  it('POST /midi should return midi file url', async () => {
    const params = [{ pitch: 69, duration: 1, velocity: 80 }];
    const res = await request(app)
      .post('/midi')
      .send({ params });
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/\.mid$/);
  });
});
