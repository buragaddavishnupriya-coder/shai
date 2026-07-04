import mysql from "mysql2/promise";

const DB_CONFIGS = [
  { host: "127.0.0.1", port: 3306, user: "root", password: "", database: "shai" },
  { host: "127.0.0.1", port: 3306, user: "root", password: "root", database: "shai" },
  { host: "localhost", port: 3306, user: "root", password: "", database: "shai" },
  { host: "localhost", port: 3306, user: "root", password: "root", database: "shai" },
];

export async function getDbConnection() {
  let lastError = null;
  
  // Try common default database passwords and host bindings
  for (const config of DB_CONFIGS) {
    try {
      const connection = await mysql.createConnection(config);
      return connection;
    } catch (err) {
      lastError = err;
    }
  }
  
  throw lastError || new Error("Could not connect to MySQL server.");
}

// Fallback Mock Data matching the user's SQL console screenshot exactly
export const MOCK_WALLET = {
  user_id: 1,
  full_name: "Test User",
  email: "test@shai.com",
  phone: "9999999999",
  wallet_balance: 5000.00,
  transaction_limit: 2000.00,
  daily_limit: 3000.00,
};

export const MOCK_SERVICES = [
  {
    service_id: 1,
    category: "Travel",
    provider_name: "IRCTC",
    item_name: "Train Ticket - Express",
    source_location: "Hyderabad",
    destination_location: "Bengaluru",
    travel_date: "2026-07-10",
    show_time: null,
    available_quantity: 50,
    price: 650.00,
    status: "Available"
  },
  {
    service_id: 2,
    category: "Travel",
    provider_name: "Red Bus",
    item_name: "AC Sleeper Bus",
    source_location: "Hyderabad",
    destination_location: "Chennai",
    travel_date: "2026-07-12",
    show_time: null,
    available_quantity: 20,
    price: 900.00,
    status: "Available"
  },
  {
    service_id: 3,
    category: "Movies",
    provider_name: "BookMyShow",
    item_name: "Movie Ticket - Evening Show",
    source_location: null,
    destination_location: null,
    travel_date: "2026-07-05",
    show_time: "7:00 PM",
    available_quantity: 100,
    price: 250.00,
    status: "Available"
  },
  {
    service_id: 4,
    category: "Shopping",
    provider_name: "Amazon",
    item_name: "Wireless Earbuds",
    source_location: null,
    destination_location: null,
    travel_date: null,
    show_time: null,
    available_quantity: 200,
    price: 1999.00,
    status: "Available"
  },
  {
    service_id: 5,
    category: "Grocery",
    provider_name: "Amazon Fresh",
    item_name: "Grocery Combo Pack",
    source_location: null,
    destination_location: null,
    travel_date: null,
    show_time: null,
    available_quantity: 500,
    price: 799.00,
    status: "Available"
  },
  {
    service_id: 6,
    category: "Cabs",
    provider_name: "Uber",
    item_name: "Cab Ride - Sedan",
    source_location: "Gachibowli",
    destination_location: "Airport",
    travel_date: null,
    show_time: null,
    available_quantity: 999,
    price: 450.00,
    status: "Available"
  }
];

export async function fetchWalletFromDb() {
  try {
    const connection = await getDbConnection();
    const [rows]: any = await connection.execute(
      "SELECT user_id, full_name, email, phone, wallet_balance, transaction_limit, daily_limit FROM user_wallet WHERE user_id = 1"
    );
    await connection.end();
    
    if (rows && rows.length > 0) {
      // Convert decimal balance fields to numbers
      return {
        ...rows[0],
        wallet_balance: parseFloat(rows[0].wallet_balance),
        transaction_limit: parseFloat(rows[0].transaction_limit),
        daily_limit: parseFloat(rows[0].daily_limit),
      };
    }
    return MOCK_WALLET;
  } catch (err) {
    console.warn("Database connection failed. Falling back to local storage wallet state.", err);
    return null; // Signals fallback to browser local storage state
  }
}

export async function fetchServicesFromDb() {
  try {
    const connection = await getDbConnection();
    const [rows]: any = await connection.execute(
      "SELECT service_id, category, provider_name, item_name, source_location, destination_location, travel_date, show_time, available_quantity, price, status FROM website_services"
    );
    await connection.end();
    
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        ...r,
        price: parseFloat(r.price),
        available_quantity: parseInt(r.available_quantity),
      }));
    }
    return MOCK_SERVICES;
  } catch (err) {
    console.warn("Database connection failed. Falling back to static database mock services.", err);
    return MOCK_SERVICES;
  }
}

export async function executeBookingInDb(serviceId: number, amount: number) {
  try {
    const connection = await getDbConnection();
    
    // Check wallet balance and limits
    const [walletRows]: any = await connection.execute(
      "SELECT wallet_balance, transaction_limit, daily_limit FROM user_wallet WHERE user_id = 1"
    );
    
    if (!walletRows || walletRows.length === 0) {
      await connection.end();
      throw new Error("User wallet profile not found.");
    }
    
    const wallet = walletRows[0];
    const balance = parseFloat(wallet.wallet_balance);
    const txnLimit = parseFloat(wallet.transaction_limit);
    
    if (amount > balance) {
      await connection.end();
      throw new Error("Insufficient wallet balance.");
    }
    
    if (amount > txnLimit) {
      await connection.end();
      throw new Error(`Transaction amount exceeds your limit of ₹${txnLimit}.`);
    }

    // Begin booking transaction
    await connection.beginTransaction();
    
    try {
      // 1. Deduct wallet balance
      await connection.execute(
        "UPDATE user_wallet SET wallet_balance = wallet_balance - ? WHERE user_id = 1",
        [amount]
      );
      
      // 2. Decrement service available quantity
      await connection.execute(
        "UPDATE website_services SET available_quantity = available_quantity - 1 WHERE service_id = ?",
        [serviceId]
      );
      
      // 3. Generate transaction hash matching varchar(64)
      const transactionHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      
      // 4. Insert dynamic transaction record matching enum values and columns
      await connection.execute(
        `INSERT INTO transactions (
          user_id, 
          service_id, 
          agent_type, 
          status, 
          payment_amount, 
          wallet_before, 
          wallet_after, 
          transaction_hash
        ) VALUES (1, ?, 'booking_agent', 'Approved', ?, ?, ?, ?)`,
        [
          serviceId,
          amount,
          balance,
          balance - amount,
          transactionHash
        ]
      );
      
      await connection.commit();
      await connection.end();
      return { success: true, balance: balance - amount };
    } catch (txnErr: any) {
      await connection.rollback();
      await connection.end();
      throw txnErr;
    }
  } catch (err: any) {
    console.error("Booking database transaction failed:", err);
    throw err;
  }
}

export async function fetchTableRows(tableName: string) {
  const allowedTables = ["user_wallet", "website_services", "transactions"];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Unauthorized table access: ${tableName}`);
  }
  
  try {
    const connection = await getDbConnection();
    const [rows]: any = await connection.execute(`SELECT * FROM \`${tableName}\``);
    await connection.end();
    
    // Parse decimal fields to float for client serialization
    return rows.map((row: any) => {
      const parsedRow = { ...row };
      // user_wallet fields
      if ('wallet_balance' in parsedRow) parsedRow.wallet_balance = parseFloat(parsedRow.wallet_balance);
      if ('transaction_limit' in parsedRow) parsedRow.transaction_limit = parseFloat(parsedRow.transaction_limit);
      if ('daily_limit' in parsedRow) parsedRow.daily_limit = parseFloat(parsedRow.daily_limit);
      
      // website_services fields
      if ('price' in parsedRow) parsedRow.price = parseFloat(parsedRow.price);
      if ('available_quantity' in parsedRow) parsedRow.available_quantity = parseInt(parsedRow.available_quantity);
      
      // transactions fields
      if ('payment_amount' in parsedRow) parsedRow.payment_amount = parseFloat(parsedRow.payment_amount);
      if ('wallet_before' in parsedRow) parsedRow.wallet_before = parseFloat(parsedRow.wallet_before);
      if ('wallet_after' in parsedRow) parsedRow.wallet_after = parseFloat(parsedRow.wallet_after);
      
      return parsedRow;
    });
  } catch (err) {
    console.error(`Failed to fetch rows for table ${tableName}:`, err);
    return [];
  }
}

export async function checkConnectionStatus() {
  try {
    const connection = await getDbConnection();
    const [dbInfo]: any = await connection.execute("SELECT DATABASE() as dbName, VERSION() as version");
    const [tableCounts]: any = await connection.execute(
      `SELECT 
        (SELECT COUNT(*) FROM user_wallet) as wallet_count,
        (SELECT COUNT(*) FROM website_services) as services_count,
        (SELECT COUNT(*) FROM transactions) as transactions_count`
    );
    await connection.end();
    
    return {
      connected: true,
      database: dbInfo[0]?.dbName || "shai",
      version: dbInfo[0]?.version || "Unknown",
      stats: {
        wallet: tableCounts[0]?.wallet_count || 0,
        services: tableCounts[0]?.services_count || 0,
        transactions: tableCounts[0]?.transactions_count || 0,
      }
    };
  } catch (err: any) {
    return {
      connected: false,
      database: "shai",
      error: err.message || "Could not connect to MySQL server",
    };
  }
}

export async function resetDbState() {
  try {
    const connection = await getDbConnection();
    await connection.beginTransaction();
    try {
      await connection.execute(
        "UPDATE user_wallet SET wallet_balance = 5000.00 WHERE user_id = 1"
      );
      
      await connection.execute("UPDATE website_services SET available_quantity = 50 WHERE service_id = 1");
      await connection.execute("UPDATE website_services SET available_quantity = 20 WHERE service_id = 2");
      await connection.execute("UPDATE website_services SET available_quantity = 100 WHERE service_id = 3");
      await connection.execute("UPDATE website_services SET available_quantity = 200 WHERE service_id = 4");
      await connection.execute("UPDATE website_services SET available_quantity = 500 WHERE service_id = 5");
      await connection.execute("UPDATE website_services SET available_quantity = 999 WHERE service_id = 6");
      await connection.execute("UPDATE website_services SET status = 'Available'");
      
      await connection.execute("DELETE FROM transactions");
      
      await connection.commit();
      await connection.end();
      return { success: true };
    } catch (txnErr) {
      await connection.rollback();
      await connection.end();
      throw txnErr;
    }
  } catch (err: any) {
    console.error("Failed to reset database state:", err);
    throw err;
  }
}
