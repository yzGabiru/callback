import { conexaoBanco } from '../db.js';

// CRIAR OS TIPOS ENUM
async function criarTiposEnum() {
  try {
    await conexaoBanco`
      CREATE TYPE DIA_SEMANA_ENUM AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA');
    `;
    console.log('TIPO ENUM "DIA_SEMANA_ENUM" CRIADO COM SUCESSO!');

    await conexaoBanco`
      CREATE TYPE STATUS_PRESENCA_ENUM AS ENUM ('VAI_VOLTA', 'SO_VAI', 'SO_VOLTA');
    `;
    console.log('TIPO ENUM "STATUS_PRESENCA_ENUM" CRIADO COM SUCESSO!');
  } catch (err) {
    console.error('ERRO AO CRIAR OS TIPOS ENUM:', err);
  }
}

// CRIAR A TABELA PRESENCA
async function criarTabelaPresenca() {
  try {
    await conexaoBanco`
      CREATE TABLE PRESENCA (
        ID_PRESENCA UUID PRIMARY KEY,                   
        DATA_CHAMADA DATE NOT NULL,                   
        DIA_SEMANA DIA_SEMANA_ENUM NOT NULL,                           
        STATUS STATUS_PRESENCA_ENUM NOT NULL, 
        STATUS_PRESENCA BOOLEAN DEFAULT FALSE,
        ID_USUARIO UUID REFERENCES USUARIO (ID_USUARIO) ON DELETE CASCADE,
        ID_ONIBUS UUID REFERENCES ONIBUS (ID_ONIBUS) ON DELETE CASCADE
      );
    `;
    console.log('TABELA PRESENCA CRIADA COM SUCESSO!');
  } catch (err) {
    console.error('ERRO AO CRIAR A TABELA:', err);
  }
}

// EXECUTAR AS FUNCOES NA ORDEM CORRETA
async function criarEstruturas() {
  await criarTiposEnum();
  await criarTabelaPresenca();
}

criarEstruturas();
