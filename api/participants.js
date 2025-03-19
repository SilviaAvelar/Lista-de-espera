require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Determine a URI do MongoDB com base no ambiente
const uri = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI // Use a variável de ambiente do Vercel (produção)
    : 'mongodb://localhost:27017/waitlistDB'; // Use o MongoDB local (desenvolvimento)

const dbName = 'waitlistDB';
const secretKey = process.env.JWT_SECRET;

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient && cachedClient._eventsCount > 0) {
        console.log("Usando conexão existente com o MongoDB");
        return cachedClient;
    }

    const client = new MongoClient(uri);

    try {
        console.log("Tentando conectar ao MongoDB...");
        await client.connect();
        console.log("Conexão com o MongoDB estabelecida com sucesso!");
        cachedClient = client;
        return client;
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        throw error;
    }
}

module.exports = async (req, res) => {
    try {
        const client = await connectToDatabase();
        const db = client.db(dbName);
        const participantsCollection = db.collection('participants');

        if (req.method === 'GET') {
            try {
                const role = req.query.role;
                const query = role ? { role: role } : {};
                console.log("Query MongoDB:", query);
                const participants = await participantsCollection.find(query).toArray();
                res.status(200).json(participants);
            } catch (error) {
                console.error('Erro ao buscar participantes:', error);
                return res.status(500).json({ message: 'Erro ao buscar participantes' });
            }
        } else if (req.method === 'POST') {
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
    }
};