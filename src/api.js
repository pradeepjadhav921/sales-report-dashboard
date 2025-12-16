// src/api.js
import axios from 'axios';
import { getFromLocalStorage, setToLocalStorage } from './utils/localStorage';

export const fetchTransactions = async () => {
  // Try to load data from local storage first
  const localTransactions = getFromLocalStorage('transactions');
  if (localTransactions) {
    // Return local data immediately
    return localTransactions;
  }

  // If no local data, fetch from API
  return await syncTransactions();
};

export const syncTransactions = async () => {
    const hotels = localStorage.getItem('hotels');
    const hotels_list = hotels ? hotels.split(",") : [];
    console.log("hotels_list", hotels,`https://api2.nextorbitals.in/api/save_transaction2.php?login_user=${hotels}`,  hotels_list);
    const response = await axios.get(`https://api2.nextorbitals.in/api/save_transaction2.php?login_user=${hotels}`);
    console.log("response.data", response.data["data"], typeof(response.data["data"]));

    // Filter transactions to only include hotels from hotels_list
    const filteredTransactions = response.data["data"].filter(transaction =>
        transaction.login_user && hotels_list.includes(transaction.login_user)
    );

    // Save to local storage
    setToLocalStorage('transactions', filteredTransactions);

    return filteredTransactions;
};

export const fetchMenu = async (hotelName) => {
    const localMenu = getFromLocalStorage(`menu_${hotelName}`);
    if (localMenu) {
        console.log("local localMenu",localMenu);
        return localMenu;
    }
    return await syncMenu(hotelName);
};

export const syncMenu = async (hotelName) => {
    if (!hotelName) {
        throw new Error("Hotel name not provided.");
    }
    try {
        const response = await fetch(
            `https://api2.nextorbitals.in/api/get_menu.php?hotel_name=${hotelName}&menutype=ac`, {
                headers: { 'Content-Type': 'application/json' },
            }
        );
        if (response.ok) {
            const jsonData = await response.json();
            if (jsonData.data && Array.isArray(jsonData.data)) {
                const menuItems = jsonData.data.map((item, index) => ({ ...item, id: item.id || `${item.name}-${index}` }));
                setToLocalStorage(`menu_${hotelName}`, menuItems);
                return menuItems;
            } else {
                throw new Error("Menu data is not in the expected format.");
            }
        } else {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
    } catch (err) {
        throw new Error(`Failed to fetch menu: ${err.message}`);
    }
};