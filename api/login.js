require('dotenv').config(); // Carrega as variáveis de ambiente

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Determine a URI do MongoDB com base no ambiente
const uri = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI // Use a variável de ambiente do Vercel (produção)
    : 'mongodb://localhost:27017/waitlistDB'; // Use o MongoDB local (desenvolvimento)

const dbName = 'waitlistDB';
const secretKey = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { password } = req.body;

        const client = new MongoClient(uri);

        try {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection('users');

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
        } finally {
            await client.close();
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};