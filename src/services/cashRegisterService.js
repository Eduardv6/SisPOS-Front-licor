import { api } from "./api";

export const cashRegisterService = {
  getStats: async () => {
    return await api.get("/openingCashRegisters/stats");
  },

  getAll: async () => {
    return await api.get("/openingCashRegisters");
  },

  open: async (data) => {
    return await api.post("/openingCashRegisters/open", data);
  },

  close: async (id, data) => {
    return await api.put(`/openingCashRegisters/${id}/close`, data);
  },

  getDetail: async (id) => {
    return await api.get(`/openingCashRegisters/${id}`);
  },

  getRecentMovements: async () => {
    return await api.get("/openingCashRegisters/movements");
  },

  addMovement: async (data) => {
    return await api.post("/openingCashRegisters/movements", data);
  },

  checkStatus: async () => {
    return await api.get("/openingCashRegisters/status");
  },
};
