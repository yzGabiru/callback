import { conexaoBanco } from "../db.js";

const Aluno = {
  async cadastrarAluno(dadosAluno) {
    const { id_usuario, nome, email, senha, numeroCelular } = dadosAluno;
    console.log("dados do aluno aqui", dadosAluno);

    const sql = `
      INSERT INTO USUARIO (ID_USUARIO, NOME, EMAIL, SENHA, NUMERO_CELULAR)
      VALUES ($1, $2, $3, $4, $5);
    `;

    try {
      const result = await conexaoBanco.unsafe(sql, [
        id_usuario,
        nome,
        email,
        senha,
        numeroCelular,
      ]);
      return result[0]; // Retorna a primeira linha inserida
    } catch (err) {
      console.error("Erro ao inserir aluno:", err);
      throw new Error("Erro ao inserir aluno");
    }
  },

  async verificaAlunoPorEmail(email) {
    const sql = `SELECT * FROM USUARIO WHERE EMAIL = $1`;

    try {
      const result = await conexaoBanco.unsafe(sql, [email]); // Passa o valor como array
      return result[0]; // Retorna o usuário encontrado ou undefined
    } catch (err) {
      console.error("Erro ao buscar no banco:", err);
      throw new Error("Erro ao buscar no banco");
    }
  },

  async verificaAlunoPorId(id_usuario) {
    const sql = `SELECT * FROM USUARIO WHERE ID_USUARIO = $1`;
    try {
      const result = await conexaoBanco.unsafe(sql, [id_usuario]);
      console.log(result);
      return result[0];
    } catch (err) {
      console.error("Erro ao buscar no banco:", err);
      throw new Error("Erro ao buscar no banco");
    }
  },

  async atualizarAluno(id_usuario, dadosAtualizados) {
    const { nome, email, num_celular, ativo, admin } = dadosAtualizados;

    const campos = [];
    const valores = [];
    let contador = 1; // Placeholder contador ($1, $2...)

    if (nome) {
      campos.push(`NOME = $${contador}`);
      valores.push(nome);
      contador++;
    }
    if (email) {
      campos.push(`EMAIL = $${contador}`);
      valores.push(email);
      contador++;
    }
    if (num_celular) {
      campos.push(`NUMERO_CELULAR = $${contador}`);
      valores.push(num_celular);
      contador++;
    }
    if (ativo !== undefined) {
      campos.push(`ATIVO = $${contador}`);
      valores.push(ativo);
      contador++;
    }
    if (admin !== undefined) {
      campos.push(`E_ADMIN = $${contador}`);
      valores.push(admin);
      contador++;
    }

    if (campos.length === 0) {
      throw new Error("Nenhum campo fornecido para atualização!");
    }

    valores.push(id_usuario);

    const sql = `
      UPDATE USUARIO
      SET ${campos.join(", ")}
      WHERE ID_USUARIO = $${contador}
      RETURNING *;
    `;

    try {
      const result = await conexaoBanco.unsafe(sql, valores);
      return result[0]; // Retorna o aluno atualizado
    } catch (err) {
      console.error("Erro ao atualizar aluno:", err);
      throw new Error("Erro ao atualizar aluno");
    }
  },
  async deletarAluno(id_usuario) {
    const usuarioExistente = await this.verificaAlunoPorId(id_usuario);
    if (!usuarioExistente) {
      throw new Error("Usuário não encontrado!");
    }

    const sql = `DELETE FROM USUARIO WHERE ID_USUARIO = $1 RETURNING *;`;

    try {
      const result = await conexaoBanco.unsafe(sql, [id_usuario]);
      return result[0]; // Retorna o registro deletado
    } catch (err) {
      console.error("Erro ao deletar aluno:", err);
      throw new Error("Erro ao deletar aluno");
    }
  },
  async buscarAlunos() {
    const sql = `SELECT ID_USUARIO, NOME, EMAIL, NUMERO_CELULAR, ATIVO, E_ADMIN FROM USUARIO ORDER BY NOME ASC;`;
    try {
      const result = await conexaoBanco.unsafe(sql, []);
      return result;
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
    }
  },
};

export { Aluno };
