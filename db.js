import dotenv from 'dotenv'; // Usando import para carregar variáveis de ambiente
import postgres from 'postgres'; // Importando a biblioteca para conexão com o PostgreSQL

dotenv.config(); // Carrega as variáveis de ambiente

const url = process.env.DATABASE_URL; // URL do banco de dados

export const conexaoBanco = postgres(url, { ssl: 'require' }); // Exporta a instância do postgres
