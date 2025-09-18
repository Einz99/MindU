import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from './apiConfigs';


export const loginUser = async (identifier: string, password: string) => {
    try {
        const response = await axios.post(`${API}/login`, { identifier, password });
        if (response.data.token) {
            await AsyncStorage.setItem('userToken', response.data.token);
        }
        return response.data;
    } catch (error: any) {
        console.log(error.response.data);
        return error.response ? error.response.data : { error: 'Server error' };
    }
};

