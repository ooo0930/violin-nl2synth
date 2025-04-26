import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
jest.mock('axios');

describe('App', () => {
  it('renders input and button', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/自然語言/i)).toBeInTheDocument();
    expect(screen.getByText(/送出/i)).toBeInTheDocument();
  });

  it('calls backend and shows params preview', async () => {
    axios.post.mockResolvedValueOnce({ data: [{ pitch: 69, duration: 1, velocity: 80 }] });
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/自然語言/i), { target: { value: '演奏一段旋律' } });
    fireEvent.click(screen.getByText(/送出/i));
    await waitFor(() => expect(screen.getByText(/pitch/i)).toBeInTheDocument());
  });
});
