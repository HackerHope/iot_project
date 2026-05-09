CREATE DATABASE iot_test_db;

USE iot_test_db;

CREATE TABLE sensor_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_name VARCHAR(100),
    sensor_value FLOAT,
    raw_data VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
