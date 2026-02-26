const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = {
  get: async (endpoint, options = {}) => {
    // Merge params into url if any
    const url = new URL(`${API_URL}${endpoint}`);
    if (options.params) {
      Object.keys(options.params).forEach((key) => {
        if (options.params[key])
          url.searchParams.append(key, options.params[key]);
      });
    }

    const token = localStorage.getItem("token");
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
    };

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid - force logout
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      throw new Error("Error en la petición GET");
    }
    return response.json();
  },
  post: async (endpoint, data) => {
    const isFormData = data instanceof FormData;
    const token = localStorage.getItem("token");
    const headers = isFormData
      ? { Authorization: token ? `Bearer ${token}` : "" }
      : {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        };

    const body = isFormData ? data : JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers,
      body,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Response:", errorData);
      throw new Error(errorData.message || "Error en la petición POST");
    }
    return response.json();
  },
  put: async (endpoint, data) => {
    const isFormData = data instanceof FormData;
    const token = localStorage.getItem("token");
    const headers = isFormData
      ? { Authorization: token ? `Bearer ${token}` : "" }
      : {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        };

    const body = isFormData ? data : JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error en la petición PUT");
    }
    return response.json();
  },
  delete: async (endpoint) => {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error en la petición DELETE");
    }
    return response.json();
  },
};
