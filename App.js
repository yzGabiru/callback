import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import { Aluno } from "./models/Usuario.js";
import { v4 as uuidv4 } from "uuid";
import { Onibus } from "./models/Onibus.js";
import { Presenca } from "./models/Presenca.js";

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// Rota pública
router.get("/", (req, res) => {
  res.status(200).json({ msg: "API Funcionando!" });
});

/*------------------------------------------FUNCOES GERAIS---------------------------------------------------------------------------*/

async function verificarToken(req, res, next) {
  const cabecalho = req.headers["authorization"];
  const token = cabecalho && cabecalho.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso Negado!" });
  }
  try {
    const segredo = process.env.SECRET;
    const tokenBruto = jwt.verify(token, segredo); // Verifica o token

    // Obtém o ID do aluno do token
    const id_usuario = tokenBruto.id;
    // Busca o usuário no banco de dados
    const usuario = await Aluno.verificaAlunoPorId(id_usuario);

    if (!usuario) {
      return res
        .status(404)
        .json({ msg: "Você não tem permissão para relaizar esta operação!" });
    }

    req.usuario = usuario; // Salva as informações do usuário na requisição
    next();
  } catch (error) {
    console.log("Erro ao verificar token:", error);
    return res.status(400).json({ msg: "Token Inválido" });
  }
}

function verificarAdmin(req, res, next) {
  const usuario = req.usuario;

  if (!usuario.e_admin) {
    return res.status(403).json({
      msg: "Acesso Negado! Apenas administradores podem realizar essa operação.",
    });
  }

  next();
}

/*------------------------------------------ROTAS USUARIOS---------------------------------------------------------------------------*/

//rota buscar todos os alunos
router.get(
  "/usuario/pegarTodos",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    try {
      const alunos = await Aluno.buscarAlunos();

      if (!alunos) {
        return res.status(404).json({ msg: "Nenhum usuário encontrado!" });
      }
      return res.status(200).json({ alunos });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ msg: "Ocorreu um erro ao buscar os alunos!" });
    }
  }
);
router.get("/usuario/buscarUsuario", async (req, res) => {
  const { id_usuario } = req.query;

  try {
    if (!id_usuario) {
      return res.status(400).json({ msg: "O ID do usuário é obrigatório!" });
    }

    const usuarioRecebido = await Aluno.verificaAlunoPorId(id_usuario);

    if (!usuarioRecebido) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({
      usuario: usuarioRecebido.nome,
    });
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).json({ msg: "Ocorreu um erro no servidor!" });
  }
});

// Rota para criar um aluno
router.post("/usuario/registro", async (req, res) => {
  // Antes de tentar criar o aluno
  console.log("Dados recebidos para cadastro:", req.body);

  const { id_usuario, nome, email, senha, confirmarSenha, numeroCelular } =
    req.body;

  if (!id_usuario || !nome || !email || !senha || !numeroCelular) {
    throw new Error("Alguns campos obrigatórios estão faltando.");
  }
  if (senha !== confirmarSenha) {
    return res.status(422).json({ msg: "As senhas não conferem!" });
  }

  const usuarioExiste = await Aluno.verificaAlunoPorEmail(email);

  if (usuarioExiste) {
    return res.status(409).json({ msg: "O email já está em uso!" });
  }

  const dificuldade = await bcrypt.genSalt(12);
  const senhaEncryptada = await bcrypt.hash(senha, dificuldade);

  try {
    const novoAluno = await Aluno.cadastrarAluno({
      id_usuario,
      nome,
      email,
      senha: senhaEncryptada,
      numeroCelular,
    });
    res
      .status(201)
      .json({ msg: "Aluno criado com sucesso!", aluno: novoAluno });
  } catch (err) {
    console.log(err);
    res.status(400).json({ erro: err.msg });
  }
});

//rota deletar um aluno
router.delete(
  "/usuario/deletar",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const { id_usuario } = req.body;

    try {
      const usuarioDeletado = await Aluno.deletarAluno(id_usuario);
      res.status(200).json({ msg: "Aluno deletado com sucesso!" });
    } catch (err) {
      if (err.message === "Usuário não encontrado!") {
        res.status(404).json({ msg: "Usuário não encontrado!" });
      } else {
        console.log(err);
        res.status(500).json({ msg: "Ocorreu um erro no servidor!" });
      }
    }
  }
);

//rota login
router.post("/usuario/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }
  if (!senha) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  const usuarioExiste = await Aluno.verificaAlunoPorEmail(email);

  if (!usuarioExiste) {
    return res.status(404).json({ msg: "Aluno não encontrado!" });
  }

  // Verificar se a senha bate
  const verificarSenha = await bcrypt.compare(senha, usuarioExiste.senha);

  if (!verificarSenha) {
    return res.status(422).json({ msg: "Senha Inválida!" });
  }

  try {
    const segredo = process.env.SECRET;
    const userId = usuarioExiste.id_usuario;
    const e_admin = usuarioExiste.e_admin;
    const token = jwt.sign(
      {
        id: usuarioExiste.id_usuario, // Use o id_aluno como chave do payload
      },
      segredo
    );

    res.status(200).json({
      msg: "Usuário autenticado com sucesso!",
      token,
      msg: "Id do usuario: ",
      userId,
      msg: "admin=",
      e_admin,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ erro: err.msg });
  }
});
/*------------------------------------------ROTAS ONIBUS---------------------------------------------------------------------------*/

router.get("/onibus/buscar", async (req, res) => {
  try {
    const onibus = await Onibus.buscarOnibus();

    if (!onibus) {
      return res.status(404).json({ msg: "Nenhum onibus encontrado!" });
    }
    return res.status(200).json({ onibus });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: "Ocorreu um erro ao buscar os onibus!" });
  }
});

//rota registro onibus
router.post(
  "/onibus/registro",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    console.log(req.body);
    const { id_onibus, nome_onibus, descricao } = req.body;

    if (!nome_onibus) {
      return res.status(400).json({ error: "Nome é obrigatório." });
    }

    try {
      // Chama a função para cadastrar o ônibus no banco
      const novoOnibus = await Onibus.cadastrarOnibus({
        id_onibus,
        nome_onibus,
        descricao,
      });
      res.status(201).json(novoOnibus); // Retorna o ônibus cadastrado
    } catch (err) {
      console.error("Erro:", err);
      res.status(400).json({ erro: err.message });
    }
  }
);

//rota deletar onibus
router.delete(
  "/onibus/deletar",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const { id_onibus } = req.body;

    try {
      const onibusDeletado = await Onibus.deletarOnibus(id_onibus);
      res.status(200).json({ msg: "Onibus deletado com sucesso!" });
    } catch (err) {
      if (err.message === "Onibus não encontrado!") {
        res.status(404).json({ msg: "Onibus não encontrado!" });
      } else {
        console.error("Erro:", err);
        res.status(400).json({ erro: err.message });
      }
    }
  }
);

/*------------------------------------------ROTAS PRESENCA---------------------------------------------------------------------------*/

//buscar presencas
router.get("/presenca/buscar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const presencas = await Presenca.buscarPresencas(id);

    if (!presencas) {
      return res
        .status(404)
        .json({ msg: "Nenhuma presença encontrada para hoje!" });
    }
    return res.status(200).json({ presencas });
  } catch (err) {
    console.error("Erro:", err);
    res.status(400).json({ erro: err.msg });
  }
});

router.get(
  "/presenca/buscar/",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    try {
      const presencas = await Presenca.buscarPresencasPorData();
      if (!presencas) {
        return res
          .status(404)
          .json({ msg: "Nenhuma presença encontrada para hoje!" });
      }
      return res.status(200).json({ presencas });
    } catch (err) {
      console.error("Erro:", err);
      res.status(400).json({ erro: err.msg });
    }
  }
);

app.get("/presenca/verificar/:id_onibus/:id_usuario", async (req, res) => {
  const { id_onibus, id_usuario } = req.params;

  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  const data = `${ano}-${mes}-${dia}`;

  if (!id_onibus || !id_usuario) {
    return res.status(400).json({ msg: "onibusId e userId são obrigatórios!" });
  }

  try {
    const presencaRetornada = await Presenca.validarPresenca(
      id_onibus,
      id_usuario
    );

    if (presencaRetornada) {
      return res
        .status(200)
        .json({ msg: "Presença encontrada.", presencaRetornada });
    }
    if (!presencaRetornada) {
      try {
        const presencaRegistrada = await Presenca.registrarPresenca({
          id_usuario,
          id_onibus,
          vai: true,
          volta: true,
          data,
          status_presenca: "PRESENTE",
        });

        return res.status(200).json({ presencaRetornada: presencaRegistrada });
      } catch (err) {
        console.error("Erro:", err);
        res.status(400).json({ erro: err.message });
      }
    }

    return res.status(404).json({ msg: "Presença não encontrada." });
  } catch (err) {
    console.error("Erro:", err);
    res.status(400).json({ erro: err.message });
  }
});

//rota adicionar presença
router.post("/presenca/adicionar", async (req, res) => {
  console.log(req.body);
  try {
    const { id_usuario, id_onibus, vai, volta, data, status_presenca } =
      req.body;

    if (
      !id_usuario ||
      !id_onibus ||
      typeof vai !== "boolean" || // Verifica explicitamente se vai é boolean
      typeof volta !== "boolean" || // Verifica explicitamente se volta é boolean
      !data ||
      !status_presenca
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    const presencaRegistrada = await Presenca.registrarPresenca({
      id_usuario,
      id_onibus,
      vai,
      volta,
      data,
      status_presenca,
    });

    res.status(200).json(presencaRegistrada);
  } catch (err) {
    console.error("Erro:", err);
    res.status(400).json({ erro: err.message });
  }
});

router.put("/presenca/editar", async (req, res) => {
  const { id_usuario, id_onibus, vai, volta, data } = req.body;

  try {
    // Verifica se a presença já existe
    const presencaExistente = await Presenca.verificaPresenca(id_usuario, data);
    const id_presenca = presencaExistente.id_presenca;

    // Atualiza o status de presença
    const presencaAtualizada = await Presenca.atualizarPresenca(
      id_presenca,
      vai,
      volta
    );

    res
      .status(200)
      .json({ msg: "Presença atualizada com sucesso!", presencaAtualizada });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ erro: err.message });
  }
});

router.put("/presenca/mudarstatus", async (req, res) => {
  const { id_presenca, status_presenca } = req.body;
  try {
    const presencaAtualizada = await Presenca.mudarStatusPresenca(
      id_presenca,
      status_presenca
    );

    if (!presencaAtualizada) {
      return res.status(404).json({ erro: "Presença não encontrada" });
    }

    return res.status(200).json(presencaAtualizada); // Retorna os dados atualizados
  } catch (err) {
    console.error("Erro:", err);
    return res.status(500).json({ erro: err.message });
  }
});

//rota deletar presença
router.delete(
  "/presenca/deletar",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const { id_usuario } = req.body;
    console.log(id_usuario);
    try {
      const presencaDeletada = await Presenca.deletarPresenca(id_usuario);
      res.status(200).json({ msg: "Presença deletada com sucesso!" });
    } catch (err) {
      if (err.message === "Presença não encontrada!") {
        res.status(404).json({ msg: "Presença não encontrada!" });
      } else {
        console.error("Erro:", err);
        res.status(500).json({ erro: err.message });
      }
    }
  }
);

//PUT - editar presenca para true quando ler o qr code!

app.use("/", router);
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
