import { api } from "./api";

const reportService = {
  getDashboardStats: async (params) => {
    return await api.get("/reports/dashboard", { params });
  },
  getSalesChart: async (params) => {
    return await api.get("/reports/sales-chart", { params });
  },
  getTopProducts: async (params) => {
    return await api.get("/reports/top-products", { params });
  },
  getProductStats: async () => {
    return await api.get("/reports/products");
  },
  getInventoryStats: async (params) => {
    return await api.get("/reports/inventory", { params });
  },
  getCashStats: async () => {
    return await api.get("/reports/cash");
  },
};

export default reportService;
