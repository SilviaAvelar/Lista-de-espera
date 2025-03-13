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

    try {
        await client.connect();
        const db = client.db(dbName);
        const participantsCollection = db.collection('participants');

        if (req.method === 'GET') {
            // Rota GET para listar participantes (com filtro opcional por função)
            const role = req.query.role;
            const query = role ? { role: role } : {}; // Cria a query com base no parâmetro 'role'
            const participants = await participantsCollection.find(query).toArray();
            res.status(200).json(participants);
        } else if (req.method === 'POST') {
            // Rota POST para adicionar participante
            const newParticipant = req.body;
            const result = await participantsCollection.insertOne(newParticipant);
            res.status(201).json({ message: 'Participante adicionado', id: result.insertedId });
        }
        else if (req.method === 'PUT') {
            // Rota PUT para atualizar participante (requer autenticação)

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
                    console.log(participantId)
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
                    res.status(500).json({ error: "Erro ao atualizar participante" });
                }
            });

        } else if (req.method === 'DELETE') {
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
                    res.status(500).json({ error: "Erro ao excluir participante" });
                }
            });
        }
        else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('Erro ao lidar com participantes:', error);
        res.status(500).json({ error: 'Erro ao lidar com participantes' });
    } finally {
        await client.close();
    }
};