import { conexaoBanco } from '../db.js';

// Criação da tabela no banco de dados
conexaoBanco`
    CREATE TABLE USUARIO (
        ID_USUARIO          UUID PRIMARY KEY,
        NOME                VARCHAR NOT NULL,   
        EMAIL               VARCHAR UNIQUE NOT NULL,  
        SENHA               VARCHAR NOT NULL,
        NUMERO_CELULAR      VARCHAR(20),
        ATIVO               BOOLEAN DEFAULT TRUE,
        E_ADMIN             BOOLEAN DEFAULT FALSE
    );
`
    .then(() => {
        console.log('Tabela criada com sucesso!');
    })
    .catch(err => {
        console.error('Erro ao criar a tabela:', err);
    });
