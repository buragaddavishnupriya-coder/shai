-- ==========================================
-- DATABASE
-- ==========================================

CREATE DATABASE IF NOT EXISTS shai_agent_ai;
USE shai_agent_ai;

-- ==========================================
-- USER & WALLET TABLE
-- ==========================================

CREATE TABLE user_wallet (

    user_id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    phone VARCHAR(15),

    password_hash VARCHAR(64) NOT NULL,

    transaction_pin_hash VARCHAR(64) NOT NULL,

    wallet_balance DECIMAL(10,2) DEFAULT 0,

    transaction_limit DECIMAL(10,2) DEFAULT 5000,

    daily_limit DECIMAL(10,2) DEFAULT 20000,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- WEBSITE SERVICES
-- ==========================================

CREATE TABLE website_services (

    service_id INT AUTO_INCREMENT PRIMARY KEY,

    category VARCHAR(50),

    provider_name VARCHAR(100),

    item_name VARCHAR(150),

    source_location VARCHAR(100),

    destination_location VARCHAR(100),

    travel_date DATE,

    show_time VARCHAR(30),

    travel_class VARCHAR(50),

    available_quantity INT,

    price DECIMAL(10,2),

    status ENUM('Available','Unavailable')
    DEFAULT 'Available'
);

-- ==========================================
-- TRANSACTIONS
-- ==========================================

CREATE TABLE transactions (

    transaction_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    service_id INT NOT NULL,

    payment_amount DECIMAL(10,2) NOT NULL,

    wallet_before DECIMAL(10,2) NOT NULL,

    wallet_after DECIMAL(10,2) NOT NULL,

    risk_score ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ),

    booking_status ENUM(
        'SUCCESS',
        'FAILED',
        'CANCELLED'
    ),

    transaction_hash VARCHAR(64),

    transaction_timestamp TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES user_wallet(user_id),

    FOREIGN KEY(service_id)
    REFERENCES website_services(service_id)
);