import { conexaoBanco } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const Presenca = {
  async registrarPresenca(dadosPresenca) {
    const { id_usuario, id_onibus, vai, volta, data, status_presenca } =
      dadosPresenca;

    let dataFormatada, dataObj;

    try {
      dataObj = converterData(data); // Usa dataHoje para validação
      dataFormatada = data; // Mantém o formato recebido (YYYY-MM-DD)
    } catch (err) {
      throw new Error(err.message);
    }

    const dia_semana = obterDiaSemana(dataObj);

    // Verifica se já existe uma presença registrada
    const presencaExistente = await this.verificaPresenca(
      id_usuario,
      dataFormatada
    );
    if (presencaExistente) {
      throw new Error(
        `O aluno já registrou presença para a ${dia_semana}-feira.`
      );
    }

    // Verifica se é um dia válido
    const fimDeSemana = await this.verificarDiaSemana(dia_semana);
    if (!fimDeSemana) {
      throw new Error(
        `O aluno não pode registrar presença para o dia ${dia_semana}.`
      );
    }

    let esta_presente = false;
    if (status_presenca === "PRESENTE") {
      esta_presente = true;
    }

    const id_presenca = uuidv4();
    const sql = `
      INSERT INTO PRESENCA (ID_PRESENCA, DATA_CHAMADA, DIA_SEMANA, VAI, VOLTA, STATUS_PRESENCA, ID_USUARIO, ID_ONIBUS)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    try {
      const result = await conexaoBanco.unsafe(sql, [
        id_presenca,
        dataFormatada,
        dia_semana,
        vai,
        volta,
        esta_presente,
        id_usuario,
        id_onibus,
      ]);
      return result[0];
    } catch (err) {
      console.error("Erro ao registrar presença:", err);
      throw new Error("Erro ao registrar presença");
    }
  },

  async verificaPresenca(id_usuario, data) {
    const sql = `SELECT * FROM PRESENCA WHERE ID_USUARIO = $1 AND DATA_CHAMADA = $2`;

    try {
      const result = await conexaoBanco.unsafe(sql, [id_usuario, data]);
      return result[0];
    } catch (err) {
      console.error("Erro ao verificar presença:", err);
      throw new Error("Erro ao verificar presença.");
    }
  },

  async deletarPresenca(id_usuario) {
    const sql = `DELETE FROM PRESENCA WHERE ID_USUARIO = $1`;
    try {
      await conexaoBanco.unsafe(sql, [id_usuario]);
      return true;
    } catch (err) {
      console.error("Erro ao deletar presença:", err);
      throw new Error("Erro ao deletar presença");
    }
  },

  async buscarPresencas() {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataHoje = `${ano}-${mes}-${dia}`;

    const sql = `SELECT * FROM PRESENCA WHERE DATA_CHAMADA = $1`;
    try {
      const result = await conexaoBanco.unsafe(sql, [dataHoje]);
      return result;
    } catch (err) {
      console.error("Erro ao buscar presenças:", err);
      throw new Error("Erro ao buscar presenças");
    }
  },

  async verificarDiaSemana(dia_semana) {
    if (dia_semana === "sabado" || dia_semana === "domingo") {
      console.error("Não é possível adicionar presença no fim de semana!");
      throw new Error("Não é possível adicionar presença no fim de semana!");
    }
    return true;
  },

  async validarPresenca(id_onibus, id_usuario) {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataHoje = `${ano}-${mes}-${dia}`;

    const sql = `SELECT * FROM PRESENCA WHERE ID_USUARIO = $1 AND DATA_CHAMADA = $2 AND ID_ONIBUS = $3`;

    try {
      const result = await conexaoBanco.unsafe(sql, [
        id_usuario,
        dataHoje,
        id_onibus,
      ]);
      return result[0];
    } catch (err) {
      console.error("Ocorreu um erro: ", err);
      throw new Error("Ocorreu um erro");
    }
  },

  async atualizarPresenca(id_presenca, status_presenca, vai, volta) {
    const sql = `
      UPDATE PRESENCA
      SET STATUS_PRESENCA = $1, VAI = $2, VOLTA = $3
      WHERE ID_PRESENCA = $4
      RETURNING *;
    `;

    const status_prese = status_presenca === "PRESENTE";

    try {
      const result = await conexaoBanco.unsafe(sql, [
        status_prese,
        vai,
        volta,
        id_presenca,
      ]);
      return result[0];
    } catch (err) {
      console.error("Erro ao atualizar presença:", err);
      throw new Error("Erro ao atualizar presença");
    }
  },
};

function obterDiaSemana(data) {
  const diasDaSemana = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];
  const diaSemanaIndice = data.getDay();
  return diasDaSemana[diaSemanaIndice];
}

function converterData(dataHoje) {
  if (!dataHoje || typeof dataHoje !== "string") {
    throw new Error(
      "Data inválida. Esperado uma string no formato YYYY-MM-DD."
    );
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dataHoje)) {
    throw new Error("Data no formato inválido. Use o formato YYYY-MM-DD.");
  }

  const [ano, mes, dia] = dataHoje.split("-").map(Number);
  const dataObj = new Date(ano, mes - 1, dia);

  if (
    dataObj.getDate() !== dia ||
    dataObj.getMonth() !== mes - 1 ||
    dataObj.getFullYear() !== ano
  ) {
    throw new Error("Data inválida.");
  }

  return dataObj;
}

export { Presenca };
