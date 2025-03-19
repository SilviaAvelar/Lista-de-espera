const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'secreta123'; 
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("Hash da senha:", hash);
  } catch (error) {
    console.error("Erro ao gerar hash:", error);
  }
}

generateHash();