import { api } from "./api";

export const userService = {
  getStats: async () => {
    return await api.get("/users/stats");
  },

  getAll: async (params) => {
    return await api.get("/users", { params });
  },

  create: async (data) => {
    return await api.post("/users", data);
  },

  update: async (id, data) => {
    return await api.put(`/users/${id}`, data);
  },

  delete: async (id) => {
    return await api.delete(`/users/${id}`);
  },
};
