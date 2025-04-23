// frontend/src/utils/surveyApi.js
import api from './api';

export const getSurveyProducts = async () => {
  const response = await api.get('/survey/products');
  return response.data;
};

export const submitSurvey = async (surveyData) => {
  const response = await api.post('/survey/submit', surveyData);
  return response.data;
};

export const checkSurveySubmission = async (mobile) => {
  const response = await api.get(`/survey/check/${mobile}`);
  return response.data;
};

// Admin API functions
export const getAdminSurveyProducts = async () => {
    const response = await api.get('/survey/products');  // Use the same endpoint as it returns all products
    return response.data;
  };

export const getAdminSurveyResponses = async () => {
  const token = localStorage.getItem('token');

  const response = await api.get('/admin/survey/responses', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createAdminSurveyProduct = async (productData) => {
  const token = localStorage.getItem('token');
  const response = await api.post('/admin/survey/products', productData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateAdminSurveyProduct = async (productId, productData) => {
  const token = localStorage.getItem('token');
  const response = await api.put(`/admin/survey/products/${productId}`, productData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteAdminSurveyProduct = async (productId) => {
  const token = localStorage.getItem('token');
  const response = await api.delete(`/admin/survey/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};