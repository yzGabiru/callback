import { conexaoBanco } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";

const Presenca = {
  async registrarPresenca(dadosPresenca) {
    const {
      id_usuario,
      id_onibus,
      vai,
      volta,
      data,
      presenca_ida,
      presenca_volta,
    } = dadosPresenca;

    let dataFormatada, dataObj;

    try {
      dataObj = converterData(data); // Usa dataHoje para validação
      dataFormatada = data; // Mantém o formato recebido (YYYY-MM-DD)
    } catch (err) {
      throw new Error(`Erro na conversão de data: ${err.message}`);
    }

    const dia_semana = obterDiaSemana(dataObj);

    // Verifica se já existe uma presença registrada
    try {
      const presencaExistente = await this.verificaPresenca(
        id_usuario,
        dataFormatada
      );
      if (presencaExistente) {
        throw new Error(
          `O aluno já registrou presença para a ${dia_semana}-feira.`
        );
      }
    } catch (err) {
      throw new Error(`Erro ao verificar presença existente: ${err.message}`);
    }

    // Verifica se é um dia válido
    const fimDeSemana = await this.verificarDiaSemana(dia_semana);
    if (!fimDeSemana) {
      throw new Error(
        `O aluno não pode registrar presença para o dia ${dia_semana}.`
      );
    }

    const id_presenca = uuidv4();
    const sql = `
      INSERT INTO PRESENCA (ID_PRESENCA, DATA_CHAMADA, DIA_SEMANA, VAI, VOLTA, PRESENCA_IDA, PRESENCA_VOLTA, ID_USUARIO, ID_ONIBUS)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    try {
      const result = await conexaoBanco.unsafe(sql, [
        id_presenca,
        dataFormatada,
        dia_semana,
        vai,
        volta,
        presenca_ida,
        presenca_volta,
        id_usuario,
        id_onibus,
      ]);
      return result[0];
    } catch (err) {
      console.error("Erro ao registrar presença:", err);
      throw new Error(
        `Erro ao registrar presença no banco de dados: ${err.message}`
      );
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

  async buscarPresencas(id_usuario, id_onibus) {
    const sql = `SELECT * FROM PRESENCA WHERE ID_USUARIO = $1 AND ID_ONIBUS = $2`;
    try {
      const result = await conexaoBanco.unsafe(sql, [id_usuario, id_onibus]);
      return result;
    } catch (err) {
      console.error("Erro ao buscar presenças:", err);
      throw new Error("Erro ao buscar presenças");
    }
  },

  async buscarPresencasOnibus(id_onibus) {
    const sql = `SELECT * FROM PRESENCA WHERE ID_ONIBUS = $1`;
    try {
      const result = await conexaoBanco.unsafe(sql, [id_onibus]);
      return result;
    } catch (err) {
      console.error("Erro ao buscar presenças:", err);
      throw new Error("Erro ao buscar presenças");
    }
  },
  async buscarPresencasPorData() {
    const data_hoje = pegarDataHoje();
    const sql = `SELECT * FROM PRESENCA WHERE DATA_CHAMADA = $1`;
    try {
      const result = await conexaoBanco.unsafe(sql, [data_hoje]);
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
    const data_hoje = pegarDataHoje();

    const sql = `SELECT * FROM PRESENCA WHERE ID_USUARIO = $1 AND DATA_CHAMADA = $2 AND ID_ONIBUS = $3`;

    try {
      const result = await conexaoBanco.unsafe(sql, [
        id_usuario,
        data_hoje,
        id_onibus,
      ]);
      return result[0];
    } catch (err) {
      console.error("Ocorreu um erro: ", err);
      throw new Error("Ocorreu um erro");
    }
  },
  //consertar a logica do horario
  async atualizarPresenca(id_presenca, id_onibus, vai, volta) {
    const sql = `
      UPDATE PRESENCA
      SET PRESENCA_IDA = $1, PRESENCA_VOLTA = $2, VAI = $3, VOLTA = $4
      WHERE ID_PRESENCA = $5 AND ID_ONIBUS = $6
      RETURNING *;
    `;

    const fusoHorario = "America/Sao_Paulo";

    const horaAtual = DateTime.now().setZone(fusoHorario);
    const hora = horaAtual.hour;

    let presenca_ida = false;
    let presenca_volta = false;
    //se menor que 6 horas da tarde ele atualiza presenca ida
    if (hora <= 18 && vai === true) {
      presenca_ida = true;
    }
    //se maior que 6 horas da tarde ele atualiza presenca volta
    if (hora >= 19) {
      presenca_volta = true;
    }

    try {
      const result = await conexaoBanco.unsafe(sql, [
        presenca_ida,
        presenca_volta,
        vai,
        volta,
        id_presenca,
        id_onibus,
      ]);
      return result[0];
    } catch (err) {
      console.error("Erro ao atualizar presença:", err);
      throw new Error("Erro ao atualizar presença");
    }
  },

  // async atualizarPresenca(id_presenca, id_onibus, vai, volta) {
  //   // Variáveis de presença inicialmente nulas
  //   let presenca_ida = null;
  //   let presenca_volta = null;

  //   // Pega a hora atual
  //   const horaAtual = new Date();
  //   const hora = horaAtual.getHours(); // Pega a hora atual

  //   // Lógica para registrar a presença com base no horário e escolha do aluno
  //   if (hora <= 18 && vai === true) {
  //     // Se é antes das 18h e o aluno vai, registra ida
  //     presenca_ida = true;
  //   }
  //   if (hora >= 19 && volta === true) {
  //     // Se é após as 18h e o aluno volta, registra volta
  //     presenca_volta = true;
  //   }

  //   // Lógica de verificação das opções válidas para 'vai' e 'volta'
  //   if (vai === true && volta === true) {
  //     // Vai e volta: ambos devem ser marcados como presentes
  //     // Não precisa fazer nada aqui, pois as presenças já foram marcadas acima
  //   } else if (vai === true && volta === false) {
  //     // Só vai: marca apenas ida e não volta
  //     presenca_volta = null;
  //   } else if (vai === false && volta === true) {
  //     // Só volta: marca apenas volta e não ida
  //     presenca_ida = null;
  //   } else {
  //     console.log(
  //       id_presenca,
  //       id_onibus,
  //       vai,
  //       volta,
  //       presenca_ida,
  //       presenca_volta
  //     );
  //     // Caso não tenha marcado nem ida nem volta, lança erro
  //     throw new Error(
  //       "Escolha inválida: deve marcar pelo menos 'vai' ou 'volta'."
  //     );
  //   }

  //   // Consulta SQL com COALESCE para não sobrescrever valores nulos
  //   const sql = `
  //     UPDATE PRESENCA
  //     SET PRESENCA_IDA = COALESCE($1::BOOLEAN, PRESENCA_IDA),
  //         PRESENCA_VOLTA = COALESCE($2::BOOLEAN, PRESENCA_VOLTA)
  //     WHERE ID_PRESENCA = $3 AND ID_ONIBUS = $4
  //     RETURNING *;
  //   `;

  //   try {
  //     const result = await conexaoBanco.unsafe(sql, [
  //       presenca_ida, // Valor para PRESENCA_IDA
  //       presenca_volta, // Valor para PRESENCA_VOLTA
  //       id_presenca, // ID_PRESENCA
  //       id_onibus, // ID_ONIBUS
  //     ]);

  //     if (result.length === 0) {
  //       throw new Error(
  //         "Erro ao atualizar presença: nenhum registro encontrado."
  //       );
  //     }

  //     return result[0]; // Retorna o registro atualizado
  //   } catch (err) {
  //     console.error("Erro ao atualizar presença:", err);
  //     throw new Error("Erro ao atualizar presença");
  //   }
  // },

  async mudarStatusPresenca(id_presenca, status_presenca, tipo) {
    let presenca_ida = false;
    let presenca_volta = false;
    if (tipo === "ida" && status_presenca === true) {
      presenca_ida = true;
    }
    if (tipo === "volta" && status_presenca === true) {
      presenca_volta = true;
    }
    const sql = `
      UPDATE PRESENCA 
      SET PRESENCA_IDA = $1, PRESENCA_VOLTA = $2 
      WHERE ID_PRESENCA = $3
      RETURNING *;
    `;
    try {
      const result = await conexaoBanco.unsafe(sql, [
        presenca_ida,
        presenca_volta,
        id_presenca,
      ]);

      // Verificar se o resultado não está vazio
      if (result.length === 0) {
        throw new Error(`Presença com ID ${id_presenca} não encontrada`);
      }

      return result[0]; // Retorna os dados atualizados
    } catch (err) {
      console.error("Erro ao mudar status da presença:", err);
      throw new Error("Erro ao mudar status da presença");
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
//a
function pegarDataHoje() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  const dataHoje = `${ano}-${mes}-${dia}`;

  return dataHoje;
}

export { Presenca };
