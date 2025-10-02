// src/api.js
import axios from 'axios';

export const fetchTransactions = async () => {
  const response = await axios.get('https://api2.nextorbitals.in/api/save_transaction.php');
  console.log("response.data", response.data["data"], typeof(response.data["data"]));
  
  const hotels = localStorage.getItem('hotels');
  const hotels_list = hotels.split(",");
  
  // Filter transactions to only include hotels from hotels_list
  const filteredTransactions = response.data["data"].filter(transaction => 
    transaction.hotel_name && hotels_list.includes(transaction.hotel_name)
  );
  
  return filteredTransactions;
};