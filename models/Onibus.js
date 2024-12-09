import { conexaoBanco } from '../db.js';

const Onibus = {
  async cadastrarOnibus(dadosOnibus) {
    const { id_onibus, nome_onibus, descricao } = dadosOnibus;

    const sql = `
      INSERT INTO ONIBUS (ID_ONIBUS, NOME_ONIBUS, DESCRICAO)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    try {
      const result = await conexaoBanco.unsafe(sql, [
        id_onibus,
        nome_onibus,
        descricao
      ]);
      return result[0]; // Retorna o ônibus inserido
    } catch (err) {
      console.error('Erro ao inserir ônibus:', err);
      throw new Error('Erro ao inserir ônibus');
    }
  },

  async verificaOnibusPorNome(nome_onibus) {
    const sql = `SELECT * FROM ONIBUS WHERE NOME_ONIBUS = $1`;

    try {
      const result = await conexaoBanco.unsafe(sql, [nome_onibus]);
      return result[0]; // Retorna o ônibus encontrado ou undefined
    } catch (err) {
      console.error('Erro ao buscar no banco:', err);
      throw new Error('Erro ao buscar no banco');
    }
  },

  async verificaOnibusPorId(id_onibus) {
    const sql = `SELECT * FROM ONIBUS WHERE ID_ONIBUS = $1`;

    try {
      const result = await conexaoBanco.unsafe(sql, [id_onibus]);
      return result[0]; // Retorna o ônibus encontrado ou undefined
    } catch (err) {
      console.error('Erro ao buscar no banco:', err);
      throw new Error('Erro ao buscar no banco');
    }
  },

  async atualizarOnibus(id_onibus, dadosAtualizados) {
    const { nome_onibus, descricao } = dadosAtualizados;

    const campos = [];
    const valores = [];
    let contador = 1; // Placeholder contador ($1, $2...)

    if (nome_onibus) {
      campos.push(`NOME_ONIBUS = $${contador}`);
      valores.push(nome_onibus);
      contador++;
    }
    if (descricao) {
      campos.push(`DESCRICAO = $${contador}`);
      valores.push(descricao);
      contador++;
    }

    if (campos.length === 0) {
      throw new Error('Nenhum campo fornecido para atualização!');
    }

    valores.push(id_onibus);

    const sql = `
      UPDATE ONIBUS
      SET ${campos.join(', ')}
      WHERE ID_ONIBUS = $${contador}
      RETURNING *;
    `;

    try {
      const result = await conexaoBanco.unsafe(sql, valores);
      return result[0]; // Retorna o ônibus atualizado
    } catch (err) {
      console.error('Erro ao atualizar ônibus:', err);
      throw new Error('Erro ao atualizar ônibus');
    }
  },

  async deletarOnibus(id_onibus) {
    const onibusExiste = await this.verificaOnibusPorId(id_onibus);
    if (!onibusExiste) {
      throw new Error('Onibus não encontrado!');
    }

    const sql = `DELETE FROM ONIBUS WHERE ID_ONIBUS = $1 RETURNING *;`;

    try {
      const result = await conexaoBanco.unsafe(sql, [id_onibus]);
      return result[0]; // Retorna o registro deletado
    } catch (err) {
      console.error('Erro ao deletar ônibus:', err);
      throw new Error('Erro ao deletar ônibus');
    }
  },
  async buscarOnibus() {
    const sql = `SELECT ID_ONIBUS, NOME_ONIBUS, DESCRICAO FROM ONIBUS ORDER BY NOME_ONIBUS   ASC;`;
    try {
      const result = await conexaoBanco.unsafe(sql, []);
      return result;
    } catch (err) {
      console.error('Erro ao buscar onibus:', err);
    }
  },
};

export { Onibus };
