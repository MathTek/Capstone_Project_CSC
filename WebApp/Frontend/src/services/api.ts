const API_BASE_URL = 'http://localhost:8000';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  display_consent?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_consent: boolean;
  cgu: boolean;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new APIError(response.status, error.detail || 'Invalid credentials');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Unable to connect to server. Please check if the backend is running.');
  }
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new APIError(response.status, error.detail || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Unable to connect to server. Please check if the backend is running.');
  }
}

export async function calculateScore(token: string, profileData: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/calculate_score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Score calculation failed' }));
      throw new APIError(response.status, error.detail || 'Score calculation failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Unable to connect to server');
  }
}

export async function getScansByUserId(token: string, userId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/get_scans_by_userid/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch scans' }));
      throw new APIError(response.status, error.detail || 'Failed to fetch scans');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Unable to connect to server');
  }
}

export async function getPIIDetailsByScanId(token: string, scanId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/get_pii_details_by_scanid/${scanId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch PII details' }));
      throw new APIError(response.status, error.detail || 'Failed to fetch PII details');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Unable to connect to server');
  }
}
