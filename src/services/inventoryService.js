import { api } from "./api";

export const inventoryService = {
  // Obtener estadísticas
  getStats: async () => {
    return await api.get("/inventory/stats");
  },

  // Obtener historial de movimientos
  getMovements: async (params) => {
    // params: { page, limit, type, warehouseId, search, startDate, endDate }
    return await api.get("/inventory/movements", { params });
  },

  // Registrar movimiento (ingreso, salida, ajuste)
  createMovement: async (data) => {
    return await api.post("/inventory/movements", data);
  },

  // Registrar transferencia
  createTransfer: async (data) => {
    return await api.post("/inventory/transfer", data);
  },
};
