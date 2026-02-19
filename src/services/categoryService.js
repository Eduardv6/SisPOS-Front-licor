import { api } from "./api";

export const categoryService = {
  getAll: async () => {
    return await api.get("/category");
  },
  getById: async (id) => {
    return await api.get(`/category/${id}`);
  },
  create: async (data) => {
    return await api.post("/category", data);
  },
  update: async (id, data) => {
    return await api.put(`/category/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/category/${id}`);
  },
};
