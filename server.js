const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

// ==========================================================================
//  Configurações do Servidor
// ==========================================================================

const app = express();
const port = 3001;
const secretKey = 'suaChaveSecretaSuperSegura';  // *** IMPORTANTE: Substitua por uma chave forte em produção! ***

// ==========================================================================
//  Middleware
// ==========================================================================

app.use(cors()); // Permite requisições de diferentes origens
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// ==========================================================================
//  Conexão com o MongoDB
// ==========================================================================

let db;
let collection;

async function connectToMongoDB() {
    const uri = "mongodb://localhost:27017";  // *** Substitua pela sua string de conexão MongoDB ***
    const client = new MongoClient(uri);
    const dbName = "waitlistDB";

    try {
        await client.connect();
        console.log("Conectado ao MongoDB");
        db = client.db(dbName);
        collection = db.collection('users');
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1); // Encerra o processo em caso de falha na conexão
    }
}

connectToMongoDB();

// ==========================================================================
//  Middlewares de Autenticação
// ==========================================================================

/**
 * Middleware para extrair o ID do participante da requisição
 */
const getParticipantId = (req, res, next) => {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID do participante inválido' });
    }
    req.participantId = new ObjectId(id);
    next();
};

/**
 * Middleware para autenticar o token JWT
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // Não autorizado

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403); // Proibido
        req.user = user;
        next();
    });
};

// ==========================================================================
//  Rotas
// ==========================================================================

/**
 * Rota para login (geração de token JWT)
 */
app.post('/login', async (req, res) => {
    const { password } = req.body;

    try {
        const user = await collection.findOne({ username: 'admin' });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordMatch) {
            const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
            res.json({ message: 'Login bem-sucedido', token: token });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error('Erro ao autenticar:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

/**
 * Rota para buscar participantes (com filtro opcional por função)
 */
app.get('/participants', async (req, res) => {
    try {
        const role = req.query.role;
        const query = role ? { role: role } : {};  // Cria a query com base no parâmetro 'role'

        const participants = await db.collection('participants').find(query).toArray();
        res.json(participants);
    } catch (error) {
        console.error("Erro ao buscar participantes:", error);
        res.status(500).json({ error: 'Erro ao buscar participantes' });
    }
});

/**
 * Rota para adicionar um novo participante
 */
app.post('/participants', async (req, res) => {
    try {
        const newParticipant = req.body;
        const result = await db.collection('participants').insertOne(newParticipant);
        res.status(201).json({ message: "Participante adicionado", id: result.insertedId });
    } catch (error) {
        console.error("Erro ao adicionar participante:", error);
        res.status(500).json({ error: "Erro ao adicionar participante" });
    }
});

/**
 * Rota para atualizar um participante existente (requer autenticação)
 */
app.put('/participants/:id', authenticateToken, getParticipantId, async (req, res) => {
    const { participantId } = req;
    const updatedParticipant = req.body;

    try {
        const result = await db.collection('participants').updateOne(
            { _id: participantId },
            { $set: updatedParticipant }
        );

        if (result.modifiedCount === 1) {
            res.json({ message: "Participante atualizado com sucesso" });
        } else {
            res.status(404).json({ error: "Participante não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao atualizar participante:", error);
        res.status(500).json({ error: "Erro ao atualizar participante" });
    }
});

/**
 * Rota para excluir um participante (requer autenticação)
 */
app.delete('/participants/:id', authenticateToken, getParticipantId, async (req, res) => {
    const { participantId } = req;

    try {
        const result = await db.collection('participants').deleteOne({ _id: participantId });

        if (result.deletedCount === 1) {
            res.json({ message: "Participante excluído" });
        } else {
            res.status(404).json({ error: "Participante não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao excluir participante:", error);
        res.status(500).json({ error: "Erro ao excluir participante" });
    }
});

// ==========================================================================
//  Inicialização do Servidor
// ==========================================================================

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});