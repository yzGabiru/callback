import { conexaoBanco } from '../db.js';

// Criação da tabela no banco de dados
conexaoBanco`
    CREATE TABLE ONIBUS (
        ID_ONIBUS           UUID PRIMARY KEY,
        NOME_ONIBUS         VARCHAR NOT NULL,   
        DESCRICAO           TEXT
    );
`
    .then(() => {
        console.log('Tabela criada com sucesso!');
    })
    .catch(err => {
        console.error('Erro ao criar a tabela:', err);
    });
