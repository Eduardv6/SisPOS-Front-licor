import { api } from "./api";

export const backupService = {
  exportData: async () => {
    // Usamos blob para la descarga del archivo
    const response = await api.get("/backup/export", { responseType: "blob" });
    return response;
  },

  importData: async (data) => {
    return await api.post("/backup/import", data);
  },

  getHistory: async () => {
    return await api.get("/backup/history");
  },
};
