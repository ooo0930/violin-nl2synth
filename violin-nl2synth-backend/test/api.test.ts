import request from 'supertest';
import app from '../src/app';

describe('Violin NL2Synth Backend API', () => {
  it('POST /translate should return musicDescription string', async () => {
    const res = await request(app)
      .post('/translate')
      .send({ description: '演奏一段溫柔的小提琴旋律' });
    expect(res.status).toBe(200);
    expect(typeof res.body.musicDescription).toBe('string');
    expect(res.body.musicDescription.length).toBeGreaterThan(0);
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

  it('POST /describe2notes should return notes array', async () => {
    const res = await request(app)
      .post('/describe2notes')
      .send({ musicDescription: '抒情的C大調小提琴旋律，節奏中等，情感豐富' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('pitch');
  });
});
