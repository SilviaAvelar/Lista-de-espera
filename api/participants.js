require('dotenv').config(); // Carrega as variáveis de ambiente

const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken'); // Importe jwt aqui
const uri = process.env.MONGODB_URI;
const dbName = 'waitlistDB';
const secretKey = process.env.JWT_SECRET; // Importe a chave secreta
// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Não autorizado' }); // Não autorizado

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ message: 'Proibido' }); // Proibido
        req.user = user;
        next();
    });
};

module.exports = async (req, res) => {
    const client = new MongoClient(uri);

    console.log("MongoDB URI:", uri); // Log da string de conexão

    try {
        await client.connect();
        console.log("Conexão com o MongoDB estabelecida com sucesso!"); // Log de sucesso

        const db = client.db(dbName);
        const participantsCollection = db.collection('participants');

        if (req.method === 'GET') {
            // Rota GET para listar participantes (com filtro opcional por função)
            try {
                const role = req.query.role;
                const query = role ? { role: role } : {}; // Cria a query com base no parâmetro 'role'
                console.log("Query MongoDB:", query);  // Adicione esta linha
                const participants = await participantsCollection.find(query).toArray();
                res.status(200).json(participants);
            } catch (error) {
                console.error('Erro ao buscar participantes:', error);
                return res.status(500).json({ message: 'Erro ao buscar participantes' });
            }
        } else if (req.method === 'POST') {
            // Rota POST para adicionar participante
            try {
                const newParticipant = req.body;
                const result = await participantsCollection.insertOne(newParticipant);
                res.status(201).json({ message: 'Participante adicionado', id: result.insertedId });
            } catch (error) {
                console.error('Erro ao adicionar participante:', error);
                return res.status(500).json({ message: 'Erro ao adicionar participante' });
            }
        }
        else if (req.method === 'PUT') {
            // Rota PUT para atualizar participante (requer autenticação)
            try {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                if (!token) {
                    return res.status(401).json({ message: 'Não autorizado' });
                }

                jwt.verify(token, secretKey, async (err, user) => {
                    if (err) {
                        return res.status(403).json({ message: 'Proibido' });
                    }
                    try {
                        const participantId = req.query.id;
                        const updatedParticipant = req.body;
                        console.log(participantId);
                        const result = await db.collection('participants').updateOne(
                            { _id: new ObjectId(participantId) },
                            { $set: updatedParticipant }
                        );
                        if (result.modifiedCount === 1) {
                            res.status(200).json({ message: "Participante atualizado com sucesso" });
                        } else {
                            res.status(404).json({ error: "Participante não encontrado" });
                        }
                    } catch (error) {
                        console.error("Erro ao atualizar participante:", error);
                        return res.status(500).json({ error: "Erro ao atualizar participante" });
                    }
                });
            } catch (error) {
                console.error('Erro na autenticação/autorização:', error);
                return res.status(500).json({ message: 'Erro interno do servidor' });
            }

        } else if (req.method === 'DELETE') {
            // Rota DELETE para excluir participante
            try {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                if (!token) {
                    return res.status(401).json({ message: 'Não autorizado' });
                }

                jwt.verify(token, secretKey, async (err, user) => {
                    if (err) {
                        return res.status(403).json({ message: 'Proibido' });
                    }

                    try {
                        const participantId = req.query.id;
                        const result = await db.collection('participants').deleteOne({ _id: new ObjectId(participantId) });

                        if (result.deletedCount === 1) {
                            res.status(200).json({ message: "Participante excluído" });
                        } else {
                            res.status(404).json({ error: "Participante não encontrado" });
                        }
                    } catch (error) {
                        console.error("Erro ao excluir participante:", error);
                        return res.status(500).json({ error: "Erro ao excluir participante" });
                    }
                });
            } catch (error) {
                console.error('Erro na autenticação/autorização:', error);
                return res.status(500).json({ message: 'Erro interno do servidor' });
            }
        }
        else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('Erro ao lidar com participantes:', error);
        return res.status(500).json({ message: 'Erro ao lidar com participantes' });
    } finally {
        try {
            await client.close();
        } catch (error) {
            console.error('Erro ao fechar a conexão com o MongoDB:', error);
        }
    }
};