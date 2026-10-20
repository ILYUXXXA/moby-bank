export const initialUserData = {
  name: "Вы хухоль",
  phone: "+375 (29) 121-67-52",
  email: "ishak@gmail.com",
  role: "PARENT", 
  
  cards: [
    {
      id: "card_1",
      name: "Кактус BYN",
      number: "1*6767",
      balance: 0.00,
      currency: "BYN",
      type: "Mastercard",
      expiry: "11/28",
      color: "bg-emerald-800"
    },
    {
      id: "card_2",
      name: "Халва MIX",
      number: "1*5252",
      balance: 320.00,
      currency: "BYN",
      type: "Visa",
      expiry: "07/29",
      color: "bg-indigo-900"
    }
  ],

  transactions: [
    { id: "t1", title: "Перевод от Ишак", amount: 50.00, isIncome: true, date: "Сегодня, 14:20" },
    { id: "t2", title: "Супермаркет", amount: -34.50, isIncome: false, date: "Вчера, 18:45" },
  ],

  familyData: {
    children: [
      { id: "c1", name: "Ишак", balance: 45.00, limit: 20.00 }
    ]
  }
};