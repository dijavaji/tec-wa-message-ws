import axios from 'axios';
import config from './index.js';

const axiosClient = axios.create({
  baseURL: config.orchestratorUrl,
  //timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosClient;
