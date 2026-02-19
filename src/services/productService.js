import { api } from "./api";

export const productService = {
  getAll: async () => {
    return await api.get("/products");
  },

  create: async (data) => {
    return await api.post("/products", data);
  },

  update: async (id, data) => {
    return await api.put(`/products/${id}`, data);
  },

  delete: async (id) => {
    return await api.delete(`/products/${id}`);
  },
};
