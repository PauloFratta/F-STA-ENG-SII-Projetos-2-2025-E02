<?php
// API de Eventos - NativaStore
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

// Classe de Eventos
class Events {
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
    
    // Listar todos os eventos
    public function listEvents() {
        try {
            $stmt = $this->db->prepare("
                SELECT e.*, u.name as author_name, u.email as author_email
                FROM events e
                INNER JOIN users u ON e.user_id = u.id
                ORDER BY e.created_at DESC
            ");
            $stmt->execute();
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ApiResponse::success($events, 'Eventos listados com sucesso');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao listar eventos: ' . $e->getMessage(), 500);
        }
    }
    
    // Criar novo evento
    public function createEvent($data, $token) {
        try {
            // Validar autenticação
            $user = $this->validateToken($token);
            if (!$user) {
                return ApiResponse::error('Token inválido ou expirado', 401);
            }
            
            // Validar dados obrigatórios
            if (empty($data['title']) || empty($data['description'])) {
                return ApiResponse::error('Título e descrição são obrigatórios');
            }
            
            // Inserir evento
            $stmt = $this->db->prepare("
                INSERT INTO events (user_id, title, description, image_url, event_date, location) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $user['id'],
                $data['title'],
                $data['description'],
                $data['image_url'] ?? null,
                $data['event_date'] ?? null,
                $data['location'] ?? null
            ]);
            
            $eventId = $this->db->lastInsertId();
            
            // Buscar evento criado
            $stmt = $this->db->prepare("
                SELECT e.*, u.name as author_name, u.email as author_email
                FROM events e
                INNER JOIN users u ON e.user_id = u.id
                WHERE e.id = ?
            ");
            $stmt->execute([$eventId]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return ApiResponse::success($event, 'Evento criado com sucesso');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao criar evento: ' . $e->getMessage(), 500);
        }
    }
    
    // Deletar evento
    public function deleteEvent($eventId, $token) {
        try {
            // Validar autenticação
            $user = $this->validateToken($token);
            if (!$user) {
                return ApiResponse::error('Token inválido ou expirado', 401);
            }
            
            // Verificar se o evento existe e pertence ao usuário
            $stmt = $this->db->prepare("SELECT user_id FROM events WHERE id = ?");
            $stmt->execute([$eventId]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$event) {
                return ApiResponse::error('Evento não encontrado', 404);
            }
            
            if ($event['user_id'] != $user['id']) {
                return ApiResponse::error('Você não tem permissão para deletar este evento', 403);
            }
            
            // Deletar evento
            $stmt = $this->db->prepare("DELETE FROM events WHERE id = ?");
            $stmt->execute([$eventId]);
            
            return ApiResponse::success(null, 'Evento deletado com sucesso');
        } catch (Exception $e) {
            return ApiResponse::error('Erro ao deletar evento: ' . $e->getMessage(), 500);
        }
    }
}

// Processar requisição
try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $events = new Events();
    
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
            echo $events->listEvents();
            break;
            
        case 'POST':
            $data = $input ?? $_POST;
            echo $events->createEvent($data, $token);
            break;
            
        case 'DELETE':
            $eventId = $_GET['id'] ?? $input['id'] ?? null;
            if (!$eventId) {
                echo ApiResponse::error('ID do evento é obrigatório', 400);
                break;
            }
            echo $events->deleteEvent($eventId, $token);
            break;
            
        default:
            echo ApiResponse::error('Método não permitido', 405);
            break;
    }
} catch (Exception $e) {
    echo ApiResponse::error('Erro interno: ' . $e->getMessage(), 500);
}

