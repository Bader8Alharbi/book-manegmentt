import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://bookmanager-1596291518.ap-southeast-2.elb.amazonaws.com', // live
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
