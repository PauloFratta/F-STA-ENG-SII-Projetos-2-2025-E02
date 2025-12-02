<?php
// API de Produtos - NativaStore
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisições OPTIONS (CORS preflight)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir configuração do banco
require_once __DIR__ . '/../config/database.php';

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

// Classe de Produtos
class Products {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    // Validar token de autenticação
    private function validateToken($token) {
        if (empty($token)) {
            return null;
        }
        
        try {
            $stmt = $this->db->prepare("
                SELECT u.id, u.name, u.email, u.account_type 
                FROM users u
                INNER JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token = ? AND s.expires_at > NOW()
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $user;
        } catch (Exception $e) {
            return null;
        }
    }
    
    // Listar produtos - todos ou apenas do vendedor logado
    public function listProducts($vendorId = null) {
        try {
            if ($vendorId) {
                // Listar apenas produtos do vendedor
                $stmt = $this->db->prepare("
                    SELECT p.*, u.name as vendor_name, vd.store_name
                    FROM products p
                    INNER JOIN users u ON p.vendor_id = u.id
                    LEFT JOIN vendor_data vd ON u.id = vd.user_id
                    WHERE p.vendor_id = ?
                    ORDER BY p.created_at DESC
                ");
                $stmt->execute([$vendorId]);
            } else {
                // Listar todos os produtos
                $stmt = $this->db->prepare("
                    SELECT p.*, u.name as vendor_name, vd.store_name
                    FROM products p
                    INNER JOIN users u ON p.vendor_id = u.id
                    LEFT JOIN vendor_data vd ON u.id = vd.user_id
                    ORDER BY p.created_at DESC
                ");
                $stmt->execute();
            }
            
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ApiResponse::success($products, 'Produtos listados com sucesso');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao listar produtos: ' . $e->getMessage(), 500);
        }
    }
    
    // Buscar produto por ID
    public function getProduct($productId) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, u.name as vendor_name, vd.store_name
                FROM products p
                INNER JOIN users u ON p.vendor_id = u.id
                LEFT JOIN vendor_data vd ON u.id = vd.user_id
                WHERE p.id = ?
            ");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                return ApiResponse::error('Produto não encontrado', 404);
            }
            
            return ApiResponse::success($product, 'Produto encontrado');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao buscar produto: ' . $e->getMessage(), 500);
        }
    }
    
    // Criar novo produto
    public function createProduct($data, $token) {
        try {
            // Validar autenticação
            $user = $this->validateToken($token);
            if (!$user) {
                return ApiResponse::error('Token inválido ou expirado', 401);
            }
            
            // Verificar se é vendedor
            if ($user['account_type'] !== 'vendedor') {
                return ApiResponse::error('Apenas vendedores podem criar produtos', 403);
            }
            
            // Validar dados obrigatórios
            if (empty($data['name']) || empty($data['description']) || empty($data['price'])) {
                return ApiResponse::error('Nome, descrição e preço são obrigatórios');
            }
            
            // Validar preço
            $price = floatval($data['price']);
            if ($price <= 0) {
                return ApiResponse::error('O preço deve ser maior que zero');
            }
            
            // Inserir produto
            $stmt = $this->db->prepare("
                INSERT INTO products (vendor_id, name, description, price, image_url, stock, category) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $user['id'],
                $data['name'],
                $data['description'],
                $price,
                $data['image_url'] ?? null,
                intval($data['stock'] ?? 0),
                $data['category'] ?? null
            ]);
            
            $productId = $this->db->lastInsertId();
            
            // Buscar produto criado
            $result = $this->getProduct($productId);
            $resultData = json_decode($result, true);
            
            return ApiResponse::success($resultData['data'], 'Produto criado com sucesso');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao criar produto: ' . $e->getMessage(), 500);
        }
    }
    
    // Atualizar produto
    public function updateProduct($productId, $data, $token) {
        try {
            // Validar autenticação
            $user = $this->validateToken($token);
            if (!$user) {
                return ApiResponse::error('Token inválido ou expirado', 401);
            }
            
            // Verificar se é vendedor
            if ($user['account_type'] !== 'vendedor') {
                return ApiResponse::error('Apenas vendedores podem atualizar produtos', 403);
            }
            
            // Verificar se o produto existe e pertence ao vendedor
            $stmt = $this->db->prepare("SELECT vendor_id FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                return ApiResponse::error('Produto não encontrado', 404);
            }
            
            if ($product['vendor_id'] != $user['id']) {
                return ApiResponse::error('Você não tem permissão para atualizar este produto', 403);
            }
            
            // Validar preço se fornecido
            if (isset($data['price'])) {
                $price = floatval($data['price']);
                if ($price <= 0) {
                    return ApiResponse::error('O preço deve ser maior que zero');
                }
            }
            
            // Construir query de atualização dinamicamente
            $fields = [];
            $values = [];
            
            $allowedFields = ['name', 'description', 'price', 'image_url', 'stock', 'category'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    if ($field === 'price') {
                        $values[] = floatval($data[$field]);
                    } elseif ($field === 'stock') {
                        $values[] = intval($data[$field]);
                    } else {
                        $values[] = $data[$field];
                    }
                }
            }
            
            if (empty($fields)) {
                return ApiResponse::error('Nenhum campo para atualizar');
            }
            
            $values[] = $productId;
            
            $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            // Buscar produto atualizado
            return $this->getProduct($productId);
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao atualizar produto: ' . $e->getMessage(), 500);
        }
    }
    
    // Deletar produto
    public function deleteProduct($productId, $token) {
        try {
            // Validar autenticação
            $user = $this->validateToken($token);
            if (!$user) {
                return ApiResponse::error('Token inválido ou expirado', 401);
            }
            
            // Verificar se é vendedor
            if ($user['account_type'] !== 'vendedor') {
                return ApiResponse::error('Apenas vendedores podem deletar produtos', 403);
            }
            
            // Verificar se o produto existe e pertence ao vendedor
            $stmt = $this->db->prepare("SELECT vendor_id FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                return ApiResponse::error('Produto não encontrado', 404);
            }
            
            if ($product['vendor_id'] != $user['id']) {
                return ApiResponse::error('Você não tem permissão para deletar este produto', 403);
            }
            
            // Deletar produto
            $stmt = $this->db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            
            return ApiResponse::success(null, 'Produto deletado com sucesso');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao deletar produto: ' . $e->getMessage(), 500);
        }
    }
}

// Processar requisição
try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $products = new Products();
    
    // Obter token do header Authorization ou do POST
    $token = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_POST['token'])) {
        $token = $_POST['token'];
    } elseif (isset($_GET['token'])) {
        $token = $_GET['token'];
    }
    
    // Obter dados JSON se houver
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $token = $token ?? $input['token'] ?? null;
    }
    
    switch ($method) {
        case 'GET':
            $productId = $_GET['id'] ?? null;
            $vendorId = $_GET['vendor_id'] ?? null;
            
            if ($productId) {
                // Buscar produto específico
                echo $products->getProduct($productId);
            } else {
                // Listar produtos
                echo $products->listProducts($vendorId);
            }
            break;
            
        case 'POST':
            $data = $input ?? $_POST;
            echo $products->createProduct($data, $token);
            break;
            
        case 'PUT':
            $productId = $_GET['id'] ?? $input['id'] ?? null;
            if (!$productId) {
                echo ApiResponse::error('ID do produto é obrigatório', 400);
                break;
            }
            $data = $input ?? $_POST;
            echo $products->updateProduct($productId, $data, $token);
            break;
            
        case 'DELETE':
            $productId = $_GET['id'] ?? $input['id'] ?? null;
            if (!$productId) {
                echo ApiResponse::error('ID do produto é obrigatório', 400);
                break;
            }
            echo $products->deleteProduct($productId, $token);
            break;
            
        default:
            echo ApiResponse::error('Método não permitido', 405);
            break;
    }
} catch (Exception $e) {
    echo ApiResponse::error('Erro interno: ' . $e->getMessage(), 500);
}

