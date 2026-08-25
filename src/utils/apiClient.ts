// Safe API utility for robust request and JSON handling across local, full-stack, and static deployments (Vercel, GitHub Pages)

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    // If server responded with HTML (e.g. 404 / 500 error page from static host like Vercel)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      const is404 = res.status === 404 || text.toLowerCase().includes('not found') || text.includes('The page c');
      
      return {
        ok: false,
        status: res.status,
        data: null,
        error: is404
          ? 'Backend API route not found. Running in static mode.'
          : `Server returned non-JSON response (${res.status})`,
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || data?.message || `Request failed with status ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network request failed',
    };
  }
}
