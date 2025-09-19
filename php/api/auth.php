<?php
// API de Autenticação - NativaStore
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Tratar requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir configuração do banco
require_once '../config/database.php';

// Classe de resposta da API
class ApiResponse {
    public static function success($data = null, $message = 'Sucesso') {
        return json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
    }
    
    public static function error($message = 'Erro', $code = 400) {
        http_response_code($code);
        return json_encode([
            'success' => false,
            'message' => $message
        ]);
    }
}

// Classe de autenticação
class Auth {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    // Registrar novo usuário
    public function register($data) {
        try {
            // Validar dados obrigatórios
            if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
                return ApiResponse::error('Nome, email e senha são obrigatórios');
            }
            
            // Validar email
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return ApiResponse::error('Email inválido');
            }
            
            // Validar senha
            if (strlen($data['password']) < 6) {
                return ApiResponse::error('A senha deve ter pelo menos 6 caracteres');
            }
            
            // Verificar se email já existe
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                return ApiResponse::error('Email já cadastrado');
            }
            
            // Hash da senha
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Inserir usuário
            $stmt = $this->db->prepare("
                INSERT INTO users (name, email, password, account_type) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $hashedPassword,
                $data['accountType'] ?? 'cliente'
            ]);
            
            $userId = $this->db->lastInsertId();
            
            // Se for vendedor, inserir dados adicionais
            if (($data['accountType'] ?? 'cliente') === 'vendedor') {
                if (empty($data['storeName']) || empty($data['storeDocument']) || empty($data['storeDescription'])) {
                    return ApiResponse::error('Dados da loja são obrigatórios para vendedores');
                }
                
                $stmt = $this->db->prepare("
                    INSERT INTO vendor_data (user_id, store_name, store_document, store_description) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([
                    $userId,
                    $data['storeName'],
                    $data['storeDocument'],
                    $data['storeDescription']
                ]);
            }
            
            return ApiResponse::success(null, 'Usuário cadastrado com sucesso');
            
        } catch (Exception $e) {
            return ApiResponse::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }
    
    // Fazer login
    public function login($email, $password) {
        try {
            // Buscar usuário
            $stmt = $this->db->prepare("
                SELECT u.*, vd.store_name, vd.store_document, vd.store_description 
                FROM users u 
                LEFT JOIN vendor_data vd ON u.id = vd.user_id 
                WHERE u.email = ?
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($password, $user['password'])) {
                return ApiResponse::error('Email ou senha incorretos', 401);
            }
            
            // Gerar token de sessão
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // Salvar sessão
            $stmt = $this->db->prepare("
                INSERT INTO user_sessions (user_id, token, expires_at) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$user['id'], $token, $expiresAt]);
            
            // Preparar dados do usuário
            $userData = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'account_type' => $user['account_type']
            ];
            
            // Adicionar dados da loja se for vendedor
            if ($user['account_type'] === 'vendedor') {
                $userData['store_name'] = $user['store_name'];
                $userData['store_document'] = $user['store_document'];
                $userData['store_description'] = $user['store_description'];
            }
            
            return ApiResponse::success([
                'user' => $userData,
                'session' => [
                    'token' => $token,
                    'expires_at' => $expiresAt
                ]
            ], 'Login realizado com sucesso');
            
        } catch (Exception $e) {
            return ApiResponse::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }
    
    // Validar sessão
    public function validateSession($token) {
        try {
            // Buscar sessão válida
            $stmt = $this->db->prepare("
                SELECT s.*, u.*, vd.store_name, vd.store_document, vd.store_description 
                FROM user_sessions s 
                JOIN users u ON s.user_id = u.id 
                LEFT JOIN vendor_data vd ON u.id = vd.user_id 
                WHERE s.token = ? AND s.expires_at > NOW()
            ");
            $stmt->execute([$token]);
            $session = $stmt->fetch();
            
            if (!$session) {
                return ApiResponse::error('Sessão inválida ou expirada', 401);
            }
            
            // Preparar dados do usuário
            $userData = [
                'id' => $session['user_id'],
                'name' => $session['name'],
                'email' => $session['email'],
                'account_type' => $session['account_type']
            ];
            
            // Adicionar dados da loja se for vendedor
            if ($session['account_type'] === 'vendedor') {
                $userData['store_name'] = $session['store_name'];
                $userData['store_document'] = $session['store_document'];
                $userData['store_description'] = $session['store_description'];
            }
            
            return ApiResponse::success([
                'valid' => true,
                'user' => $userData
            ], 'Sessão válida');
            
        } catch (Exception $e) {
            return ApiResponse::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }
    
    // Fazer logout
    public function logout($token) {
        try {
            // Remover sessão
            $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE token = ?");
            $stmt->execute([$token]);
            
            return ApiResponse::success(null, 'Logout realizado com sucesso');
            
        } catch (Exception $e) {
            return ApiResponse::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }
}

// Processar requisição
try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    $auth = new Auth();
    
    switch ($action) {
        case 'register':
            echo $auth->register($input);
            break;
            
        case 'login':
            if (empty($input['email']) || empty($input['password'])) {
                echo ApiResponse::error('Email e senha são obrigatórios');
                break;
            }
            echo $auth->login($input['email'], $input['password']);
            break;
            
        case 'validate':
            if (empty($input['token'])) {
                echo ApiResponse::error('Token é obrigatório');
                break;
            }
            echo $auth->validateSession($input['token']);
            break;
            
        case 'logout':
            if (empty($input['token'])) {
                echo ApiResponse::error('Token é obrigatório');
                break;
            }
            echo $auth->logout($input['token']);
            break;
            
        default:
            echo ApiResponse::error('Ação não reconhecida', 400);
            break;
    }
    
} catch (Exception $e) {
    echo ApiResponse::error('Erro interno do servidor: ' . $e->getMessage(), 500);
}
?>
