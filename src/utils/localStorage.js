// src/utils/localStorage.js

export const getFromLocalStorage = (key) => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error getting data from local storage:', error);
        return null;
    }
};

export const setToLocalStorage = (key, value) => {
    try {
        console.log("transection to save",value);
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error setting data to local storage:', error);
    }
};
