-- ========================================
-- Banco de Dados NutriChef
-- ========================================
CREATE DATABASE IF NOT EXISTS NutriChef;
USE NutriChef;

-- ========================================
-- TABELAS
-- ========================================

CREATE TABLE IF NOT EXISTS categorias (
    id_categorias INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS caracteristicas (
    id_caracteristicas INT AUTO_INCREMENT PRIMARY KEY,
    caracteristica VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredientes (
    id_ingrediente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    custo_ingrediente DECIMAL(10,2),
    id_caracteristica INT,
    FOREIGN KEY (id_caracteristica) REFERENCES caracteristicas(id_caracteristicas)
);

CREATE TABLE IF NOT EXISTS utensilios (
    id_utensilio INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuarios INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    foto VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS adm (
    id_adm INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS dificuldade (
    idDificuldade INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS receitas (
    id_receitas INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    porcoes INT,
    custo_aproximado DECIMAL(10,2),
    idDificuldade INT,
    id_categoria INT,
    id_ingrediente_base INT,
    tempo_preparo INT,
    imagem VARCHAR(255) DEFAULT 'default.jpg',
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categorias),
    FOREIGN KEY (id_ingrediente_base) REFERENCES ingredientes(id_ingrediente),
    FOREIGN KEY (idDificuldade) REFERENCES dificuldade(idDificuldade)
);

CREATE TABLE IF NOT EXISTS receita_ingredientes (
    id_ingrediente INT,
    id_receitas INT,
    quantidade DECIMAL(10,2),
    unidade VARCHAR(50),
    PRIMARY KEY (id_ingrediente, id_receitas),
    FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id_ingrediente),
    FOREIGN KEY (id_receitas) REFERENCES receitas(id_receitas)
);

CREATE TABLE IF NOT EXISTS receita_utensilios (
    id_receitas INT,
    id_utensilio INT,
    PRIMARY KEY (id_receitas, id_utensilio),
    FOREIGN KEY (id_receitas) REFERENCES receitas(id_receitas),
    FOREIGN KEY (id_utensilio) REFERENCES utensilios(id_utensilio)
);

CREATE TABLE IF NOT EXISTS receita_passos (
    id_passos INT AUTO_INCREMENT PRIMARY KEY,
    id_receitas INT,
    descricao TEXT,
    ordem INT,
    FOREIGN KEY (id_receitas) REFERENCES receitas(id_receitas)
);

CREATE TABLE IF NOT EXISTS receitas_caracteristicas (
    id_receitas INT,
    id_caracteristicas INT,
    PRIMARY KEY (id_receitas, id_caracteristicas),
    FOREIGN KEY (id_receitas) REFERENCES receitas(id_receitas),
    FOREIGN KEY (id_caracteristicas) REFERENCES caracteristicas(id_caracteristicas)
);

CREATE TABLE IF NOT EXISTS avaliacoes (
    id_avaliacoes INT AUTO_INCREMENT PRIMARY KEY,
    id_usuarios INT,
    id_receitas INT,
    nota INT,
    comentario TEXT,
    data DATE,
    status VARCHAR (30) DEFAULT 'Pendente',
    FOREIGN KEY (id_usuarios) REFERENCES usuarios(id_usuarios),
    FOREIGN KEY (id_receitas) REFERENCES receitas(id_receitas)
);

CREATE TABLE IF NOT EXISTS favoritos (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_receita INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuarios),
    FOREIGN KEY (id_receita) REFERENCES receitas(id_receitas)
);

-- ========================================
-- INSERTS DE TESTE
-- ========================================

-- Usuários
INSERT INTO usuarios (nome, email, senha) VALUES
('João leila', 'ghggjmgj@gmail.com', '560789'),
('João Silva', 'joao@exemplo.com', '1234'),
('Maria Oliveira', 'maria@exemplo.com', 'abcd'),
('Carlos Souza', 'carlos@exemplo.com', 'senha123');

-- Adm
INSERT INTO adm (nome, senha) VALUES
('Vittor Nascimento', '1234'),
('Gustavo Quintanilia', 'abcd'),
('Carlos Eduardo', 'senha123');

-- Categorias
-- INSERT INTO categorias (nome) VALUES
-- ('Bolos'),('Massas'),('Saladas'),('Diversos');

-- Ingredientes
INSERT INTO ingredientes (nome, tipo, custo_ingrediente) VALUES
('Cenoura', 'Legume', 5.00),
('Carne Moída', 'Carne', 25.00),
('Frango', 'Carne', 20.00),
('Leite Condensado', 'Laticínio', 8.00),
('Açúcar', 'Açúcar', 3.00),
('Ovos', 'Ovo', 4.00),
('Arroz', 'Grão', 10.00),
('Alface', 'Folha', 3.00);

-- Utensílios
INSERT INTO utensilios (nome) VALUES
('Forma de pudim'),('Panela'),('Liquidificador'),('Espátula');

-- Dificuldades
INSERT INTO dificuldade (nome) VALUES
('Muito Fácil'), ('Fácil'), ('Médio'), ('Difícil'), ('Muito Difícil');

-- ========================================
-- PROCEDURES
-- ========================================

DELIMITER //

CREATE PROCEDURE spInsere_Usuario (
    IN emailUser VARCHAR(100),
    IN senhaUser VARCHAR(255),
    IN nomeUser VARCHAR(100),
    IN fotoUser VARCHAR(255)
)
BEGIN
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = emailUser) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível fazer cadastro! Email já cadastrado!';
    ELSE
        INSERT INTO usuarios (email, senha, nome, foto)
        VALUES (emailUser, senhaUser, nomeUser, fotoUser);
    END IF;
END;
//

CREATE PROCEDURE spInsere_Categoria (
    IN nomeCategoria VARCHAR(100)
)
BEGIN
    IF EXISTS (SELECT 1 FROM categorias WHERE nome = nomeCategoria) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria já cadastrada!';
    ELSE
        INSERT INTO categorias (nome) VALUES (nomeCategoria);
    END IF;
END;
//

CREATE PROCEDURE spInsere_Caracteristica (
    IN descCaracteristica VARCHAR(100)
)
BEGIN
    INSERT INTO caracteristicas (caracteristica) VALUES (descCaracteristica);
END;
//

CREATE PROCEDURE spInsere_Ingrediente (
    IN nomeIngrediente VARCHAR(100),
    IN tipoIngrediente VARCHAR(50),
    IN custo DECIMAL(10,2),
    IN idCaracteristica INT
)
BEGIN
    IF EXISTS (SELECT 1 FROM ingredientes WHERE nome = nomeIngrediente) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ingrediente já cadastrado!';
    ELSE
        INSERT INTO ingredientes (nome, tipo, custo_ingrediente, id_caracteristica)
        VALUES (nomeIngrediente, tipoIngrediente, custo, idCaracteristica);
    END IF;
END;
//

CREATE PROCEDURE spInsere_Receita(
    IN p_nome VARCHAR(255),
    IN p_descricao TEXT,
    IN p_porcoes INT,
    IN p_custo DECIMAL(10,2),
    IN p_dificuldade INT,
    IN p_idCategoria INT,
    IN p_idIngredienteBase INT,
    IN p_tempoPreparo INT,
    IN p_imagem VARCHAR(255)
)
BEGIN
    INSERT INTO receitas (
        nome, descricao, porcoes, custo_aproximado, idDificuldade,
        id_categoria, id_ingrediente_base, tempo_preparo, imagem
    )
    VALUES (
        p_nome, p_descricao, p_porcoes, p_custo, p_dificuldade,
        p_idCategoria, p_idIngredienteBase, p_tempoPreparo, p_imagem
    );

    SELECT LAST_INSERT_ID() AS id_receitas;
END;
//

CREATE PROCEDURE spInsere_Adm (
    IN nomeAdm VARCHAR(100),
    IN senhaAdm VARCHAR(255)
)
BEGIN
    IF EXISTS (SELECT 1 FROM adm WHERE nome = nomeAdm) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível fazer cadastro! Nome já cadastrado!';
    ELSE
        INSERT INTO adm (nome, senha) VALUES (nomeAdm, senhaAdm);
    END IF;
END;
//

DELIMITER ;

select*from usuarios;

select*from favoritos
select * from receitas

SELECT * FROM acessos;


ALTER TABLE usuarios
ADD status VARCHAR(20) DEFAULT 'ativo';

ALTER TABLE usuarios
ADD motivo_suspensao TEXT NULL;


CREATE TABLE IF NOT EXISTS acessos (
    id_acesso INT AUTO_INCREMENT PRIMARY KEY,
    id_receitas INT NOT NULL,
    data_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_receitas) REFERENCES receitas(id_receitas) ON DELETE CASCADE
);


SELECT 
    r.id_receitas,
    r.nome AS receita,
    COUNT(a.id_avaliacoes) AS acessos
FROM receitas r
LEFT JOIN avaliacoes a ON a.id_receitas = r.id_receitas
GROUP BY r.id_receitas
ORDER BY acessos DESC
LIMIT 10;
