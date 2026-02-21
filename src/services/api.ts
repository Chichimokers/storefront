import type {
  Product,
  ProductsResponse,
  AuthResponse,
  Tokens,
  User,
  Category,
  Order,
  OrdersResponse,
  CheckoutRequest,
  CheckoutResponse,
  ProfileUpdateRequest,
} from './types';

const API_BASE_URL = 'https://inventory.cloduns.be/api/v1';

class APIService {
  private baseURL: string;
  private tokens: Tokens | null;
  private isRefreshing: boolean;
  private refreshSubscribers: ((token: string) => void)[];

  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokens = this.loadTokens();
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  loadTokens(): Tokens | null {
    const tokensStr = localStorage.getItem('tokens');
    if (tokensStr) {
      try {
        return JSON.parse(tokensStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  saveTokens(tokens: Tokens): void {
    this.tokens = tokens;
    localStorage.setItem('tokens', JSON.stringify(tokens));
  }

  clearTokens(): void {
    this.tokens = null;
    localStorage.removeItem('tokens');
  }

  isAuthenticated(): boolean {
    return !!this.tokens?.access;
  }

  getAuthHeader(): Record<string, string> {
    if (!this.tokens?.access) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.tokens.access}`
    };
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: this.tokens.refresh })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.saveTokens({
      access: data.access,
      refresh: data.refresh || this.tokens.refresh
    });

    return this.tokens.access;
  }

  subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  notifySubscribers(token: string): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string>)
    };

    let response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401 && this.tokens?.refresh) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.notifySubscribers(newToken);

          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers
          });
        } catch (error) {
          this.isRefreshing = false;
          throw error;
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          this.subscribeTokenRefresh((token) => {
            headers['Authorization'] = `Bearer ${token}`;
            fetch(url, { ...options, headers })
              .then(resolve)
              .catch(reject);
          });
        });
      }
    }

    let data: T | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error((data as Record<string, unknown>)?.error as string || (data as Record<string, unknown>)?.detail as string || `HTTP ${response.status}`);
      throw error;
    }

    return data as T;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth endpoints
  async register(email: string, username: string, password: string, passwordConfirm: string, firstName: string, lastName: string, phone: string): Promise<AuthResponse> {
    const data = await this.post<AuthResponse>('/users/register/', {
      email,
      username,
      password,
      password_confirm: passwordConfirm,
      first_name: firstName,
      last_name: lastName,
      phone
    });
    if (data.tokens) {
      this.saveTokens(data.tokens);
    }
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.post<AuthResponse>('/users/login/', { email, password });
    this.saveTokens(data.tokens);
    return data;
  }

  async logout(): Promise<void> {
    try {
      if (this.tokens?.refresh) {
        await this.post('/users/logout/', { refresh: this.tokens.refresh });
      }
    } finally {
      this.clearTokens();
    }
  }

  async getProfile(): Promise<User> {
    return this.get<User>('/users/profile/');
  }

  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    return this.put<User>('/users/profile/', data);
  }

  // Products endpoints
  async getProducts(params?: {
    category?: number;
    subcategory?: number;
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category.toString());
    if (params?.subcategory) searchParams.append('subcategory', params.subcategory.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.ordering) searchParams.append('ordering', params.ordering);
    if (params?.page) searchParams.append('page', params.page.toString());

    const query = searchParams.toString();
    return this.get<ProductsResponse>(`/products/${query ? `?${query}` : ''}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.get<Product>(`/products/${id}/`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.get<Product[]>('/products/featured/');
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/products/categories/');
  }

  async getSubcategories(categoryId: number): Promise<Category[]> {
    return this.get<Category[]>(`/products/categories/${categoryId}/subcategories/`);
  }

  // Orders endpoints
  async checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
    return this.post<CheckoutResponse>('/orders/checkout/', data);
  }

  async getOrders(): Promise<OrdersResponse> {
    return this.get<OrdersResponse>('/orders/');
  }

  async getOrder(id: number): Promise<Order> {
    return this.get<Order>(`/orders/${id}/`);
  }
}

export const api = new APIService();
export default api;
