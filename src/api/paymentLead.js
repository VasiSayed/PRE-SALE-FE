// src/api/paymentLead.js
import axiosInstance from "./axiosInstance"; // path adjust if needed

export async function createPaymentLead(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      // File object bhi allowed hai
      !(Array.isArray(value) && value.length === 0)
    ) {
      formData.append(key, value);
    }
  });

  const res = await axiosInstance.post("/sales/payment-leads/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

// Create KYC payment against a booking
export async function createKycPayment(bookingId, payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      formData.append(key, value);
    }
  });

  const res = await axiosInstance.post(
    `/book/bookings/${bookingId}/kyc-payment/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}