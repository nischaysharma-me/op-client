import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import { vi, test, expect } from 'vitest';

vi.mock('axios');

test('renders opinion polls title', async () => {
  vi.mocked(axios.get).mockResolvedValue({ data: { title: 'Test Title' } });
  
  render(<App />);
  const titleElement = screen.getByText(/opinion polls/i);
  expect(titleElement).toBeInTheDocument();
  
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
});
