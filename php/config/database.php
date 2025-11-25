<?php
// Configuração do banco de dados - NativaStore
// Configurações para XAMPP

class Database {
    private $host = 'localhost';
    private $db_name = 'nativastore';
    private $username = 'root';
    private $password = '';
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            throw new Exception('Erro de conexão com o banco: ' . $exception->getMessage(), 0, $exception);
        }

        return $this->conn;
    }
}
?>
