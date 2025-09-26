// src/api.js

// This is a mock function. Replace this with your actual API call.
// Example:
import axios from 'axios';
export const fetchTransactions = async () => {
  const response = await axios.get('https://api2.nextorbitals.in/api/save_transaction.php');
  console.log("response.data",response.data["data"],typeof(response.data["data"]));
  return response.data["data"];
};



// Mock data that resembles your API response
const mockData = [
  {
    transactions_id: "BILL-001",
    payment_mode: "Cash",
    transaction_time: "2025-09-24T10:00:00Z",
    cart_data: [
      { item_name: "Espresso", quantity: 2, price: 150 },
      { item_name: "Croissant", quantity: 1, price: 120 },
    ],
    total_amount: 420,
    table_number: "5",
    hotel_name: "Grand Hotel",
  },
  {
    transactions_id: "BILL-002",
    payment_mode: "Credit Card",
    transaction_time: "2025-09-23T11:30:00Z",
    cart_data: [
      { item_name: "Latte", quantity: 1, price: 180 },
    ],
    total_amount: 180,
    table_number: "2",
    hotel_name: "Grand Hotel",
  },
  {
    transactions_id: "BILL-003",
    payment_mode: "UPI",
    transaction_time: "2025-09-22T09:15:00Z",
    cart_data: [
      { item_name: "Pancakes", quantity: 2, price: 250 },
      { item_name: "Orange Juice", quantity: 2, price: 100 },
    ],
    total_amount: 700,
    table_number: "8",
    hotel_name: "Beachside Resort",
  },
  // Add more mock data for the last 7 days and for different hotels
  {
    transactions_id: "BILL-004",
    payment_mode: "Cash",
    transaction_time: "2025-09-21T14:00:00Z",
    total_amount: 550,
    hotel_name: "Grand Hotel",
    table_number: "1",
    cart_data: [{ item_name: 'Pizza', quantity: 1, price: 550 }],
  },
  {
    transactions_id: "BILL-005",
    payment_mode: "Cash",
    transaction_time: "2025-09-20T19:45:00Z",
    total_amount: 1200,
    hotel_name: "Grand Hotel",
    table_number: "11",
    cart_data: [{ item_name: 'Steak Dinner', quantity: 2, price: 600 }],
  },
  {
    transactions_id: "BILL-006",
    payment_mode: "Credit Card",
    transaction_time: "2025-09-19T20:00:00Z",
    total_amount: 850,
    hotel_name: "Grand Hotel",
    table_number: "3",
    cart_data: [{ item_name: 'Pasta', quantity: 2, price: 425 }],
  },
  {
    transactions_id: "BILL-007",
    payment_mode: "UPI",
    transaction_time: "2025-09-18T13:10:00Z",
    total_amount: 300,
    hotel_name: "Grand Hotel",
    table_number: "7",
    cart_data: [{ item_name: 'Sandwich', quantity: 2, price: 150 }],
  },
    {
    transactions_id: "BILL-008",
    payment_mode: "UPI",
    transaction_time: "2025-09-17T12:00:00Z",
    total_amount: 900,
    hotel_name: "Grand Hotel",
    table_number: "4",
    cart_data: [{ item_name: 'Burger Combo', quantity: 3, price: 300 }],
  },
  {
    transactions_id: "BILL-009",
    payment_mode: "Cash",
    transaction_time: "2025-09-24T12:00:00Z",
    total_amount: 450,
    hotel_name: "Beachside Resort",
    table_number: "12",
    cart_data: [{ item_name: 'Fish Tacos', quantity: 3, price: 150 }],
  }
];

// export const fetchTransactions = () => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(mockData);
//     }, 1000); // Simulate network delay
//   });
// };