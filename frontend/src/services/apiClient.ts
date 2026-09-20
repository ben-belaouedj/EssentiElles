/**
 * Enhanced API Client with retry logic, error handling, and interceptors
 */
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../constants/api';

const API_URL = getApiBaseUrl();
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        if (!this.accessToken) {
          this.accessToken = await AsyncStorage.getItem('access_token');
        }

        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        // Add request timestamp for monitoring
        config.headers['X-Request-Time'] = new Date().toISOString();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and retries
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.handleTokenExpired();
          return Promise.reject(this.formatError(error));
        }

        // Handle network errors with retry
        if (this.shouldRetry(error) && !originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }

        if (
          this.shouldRetry(error) &&
          originalRequest._retryCount < MAX_RETRIES
        ) {
          originalRequest._retryCount += 1;
          await this.delay(RETRY_DELAY * originalRequest._retryCount);
          return this.client(originalRequest);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on 5xx server errors
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle token expiration
   */
  private async handleTokenExpired(): Promise<void> {
    this.accessToken = null;
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    // Trigger logout or refresh token logic here
  }

  /**
   * Format error response
   */
  private formatError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      return {
        message:
          (error.response.data as any)?.detail ||
          (error.response.data as any)?.message ||
          'Une erreur est survenue',
        status: error.response.status,
        code: (error.response.data as any)?.code,
        details: error.response.data,
      };
    } else if (error.request) {
      // No response received
      return {
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
        code: 'NETWORK_ERROR',
      };
    } else {
      // Request setup error
      return {
        message: error.message || 'Une erreur inattendue est survenue',
        code: 'REQUEST_ERROR',
      };
    }
  }

  /**
   * Set access token
   */
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Clear access token
   */
  public clearAccessToken(): void {
    this.accessToken = null;
  }

  /**
   * GET request
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
