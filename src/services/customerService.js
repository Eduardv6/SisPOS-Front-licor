import { api } from "./api";

export const customerService = {
  // Obtener estadísticas
  getStats: async () => {
    return await api.get("/customers/stats");
  },

  // Listar clientes
  getAll: async (params) => {
    // params: { page, limit, search, tipo }
    return await api.get("/customers", { params });
  },

  // Crear cliente
  create: async (data) => {
    return await api.post("/customers", data);
  },

  // Actualizar cliente
  update: async (id, data) => {
    return await api.put(`/customers/${id}`, data);
  },

  // Eliminar cliente
  delete: async (id) => {
    return await api.delete(`/customers/${id}`);
  },

  // Historial de compras
  getHistory: async (id, params) => {
    return await api.get(`/customers/${id}/history`, { params });
  },
};
