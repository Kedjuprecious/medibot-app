import axios from "axios";

const api = axios.create({
    baseURL: 'https://medibot-app-yttz.onrender.com',
    headers:{
        'Content-Type': 'application/json',
    }
})

export default api;