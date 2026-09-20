/**
 * Tests for the enhanced API client (base URL, interceptors wiring, requests)
 */

jest.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    create: jest.fn(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

import { apiClient } from '../apiClient';
import { getApiBaseUrl } from '../../constants/api';

const axiosMock = jest.requireMock('axios') as any;
const instance = axiosMock.__mockInstance;

describe('ApiClient', () => {
  beforeEach(() => {
    instance.get.mockReset();
    instance.post.mockReset();
  });

  it('creates the axios instance with the resolved API base URL', () => {
    expect(axiosMock.create).toHaveBeenCalled();
    const config = axiosMock.create.mock.calls[0][0];
    expect(config.baseURL).toBe(getApiBaseUrl());
    expect(config.timeout).toBeGreaterThan(0);
  });

  it('registers request and response interceptors', () => {
    expect(instance.interceptors.request.use).toHaveBeenCalled();
    expect(instance.interceptors.response.use).toHaveBeenCalled();
  });

  it('makes a successful GET request and unwraps data', async () => {
    const payload = { id: '1', name: 'Test Product' };
    instance.get.mockResolvedValue({ data: payload });

    const result = await apiClient.get('/products/1');

    expect(instance.get).toHaveBeenCalledWith('/products/1', undefined);
    expect(result).toEqual(payload);
  });

  it('makes a successful POST request and unwraps data', async () => {
    const payload = { success: true };
    instance.post.mockResolvedValue({ data: payload });

    const result = await apiClient.post('/products', { name: 'New Product' });

    expect(instance.post).toHaveBeenCalledWith('/products', { name: 'New Product' }, undefined);
    expect(result).toEqual(payload);
  });

  it('supports token setters without throwing', () => {
    expect(() => {
      apiClient.setAccessToken('test-token-123');
      apiClient.clearAccessToken();
    }).not.toThrow();
  });
});
