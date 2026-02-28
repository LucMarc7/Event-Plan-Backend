const axios = require('axios');

class PaymentService {
  constructor() {
    this.baseURL = 'https://serdipay.com/api/public-api/v1/merchant';
    this.email = process.env.SERDIPAY_EMAIL;
    this.password = process.env.SERDIPAY_PASSWORD;
    this.api_id = process.env.SERDIPAY_API_ID;
    this.api_password = process.env.SERDIPAY_API_PASSWORD;
    this.merchantCode = process.env.SERDIPAY_MERCHANT_CODE;
    this.merchant_pin = process.env.SERDIPAY_MERCHANT_PIN;
    this.accessToken = null;
    this.simulate = process.env.NODE_ENV !== 'production';
  }

  async getToken() {
    if (this.simulate) {
      return 'simulated_token_123';
    }
    try {
      const response = await axios.post(`${this.baseURL}/get-token`, {
        email: this.email,
        password: this.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.status === 200 && response.data.access_token) {
        this.accessToken = response.data.access_token;
        return this.accessToken;
      } else {
        throw new Error('Failed to get token');
      }
    } catch (error) {
      console.error('Error getting token:', error.response?.data || error.message);
      throw error;
    }
  }

  async initiatePayment({ clientPhone, amount, currency, telecom }) {
    if (this.simulate) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        status: 102,
        data: {
          transactionId: `SIM_${Date.now()}`,
          sessionId: `SESS_${Date.now()}`
        }
      };
    }

    try {
      if (!this.accessToken) {
        await this.getToken();
      }

      const response = await axios.post(`${this.baseURL}/payment-merchant`, {
        api_id: this.api_id,
        api_password: this.api_password,
        merchantCode: this.merchantCode,
        merchant_pin: this.merchant_pin,
        clientPhone,
        amount,
        currency,
        telecom
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data
        };
      }
      throw error;
    }
  }
}

module.exports = new PaymentService();