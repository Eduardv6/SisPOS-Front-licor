import { api } from "./api";

export const settingService = {
  getSettings: async () => {
    return await api.get("/settings");
  },

  updateSettings: async (data) => {
    return await api.post("/settings", data);
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    return await api.post("/settings/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
