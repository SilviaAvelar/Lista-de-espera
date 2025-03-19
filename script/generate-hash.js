require('dotenv').config();
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = process.env.ADMIN_PASSWORD; // Obtenha a senha da variável de ambiente
  const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10; // Obtenha o número de rounds da variável de ambiente (padrão: 10)

  if (!password) {
    console.error("Erro: A variável de ambiente ADMIN_PASSWORD não está definida.");
    return;
  }

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("Hash da senha:", hash);
  } catch (error) {
    console.error("Erro ao gerar hash:", error);
  }
}

generateHash();