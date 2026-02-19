import { api } from "./api";

export const salesService = {
  getProducts: async (search = "", category = "") => {
    try {
      const response = await api.get("/sales/products", {
        params: { search, category },
      });
      return response;
    } catch (error) {
      throw error.response?.data?.message || "Error al obtener productos";
    }
  },

  createSale: async (saleData) => {
    try {
      const response = await api.post("/sales", saleData);
      return response;
    } catch (error) {
      throw error.response?.data?.message || "Error al procesar la venta";
    }
  },
};
