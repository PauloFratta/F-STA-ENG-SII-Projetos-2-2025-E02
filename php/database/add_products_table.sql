-- Script SQL para adicionar tabela de produtos em banco existente
-- Execute este script no phpMyAdmin se você já tem o banco criado

USE nativastore;

-- Criar tabela de produtos (se não existir)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500) NULL,
    stock INT DEFAULT 0,
    category VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_products_vendor (vendor_id),
    INDEX idx_products_category (category)
);

