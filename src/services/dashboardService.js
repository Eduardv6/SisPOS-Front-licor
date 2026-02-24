import { api } from "./api";

const dashboardService = {
  getDashboardData: async (period = "semana") => {
    return await api.get(`/dashboard?period=${period}`);
  },
};

export default dashboardService;
