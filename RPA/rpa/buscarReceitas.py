import time
import re
import mysql.connector
from mysql.connector import Error
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ==============================
# 🔌 CONEXÃO COM O BANCO
# ==============================
def conectar_mysql():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1234",
            database="nutrichef"
        )
        if conn.is_connected():
            print("✅ Conectado ao MySQL")
            return conn
    except Error as e:
        print(f"❌ Erro ao conectar ao MySQL: {e}")
        exit()

# ==============================
# 🔧 FUNÇÕES AUXILIARES
# ==============================
def limpar_ingrediente(texto):
    texto = re.sub(r'^[^\w]+', '', texto)
    return texto.replace("null", "").strip()

def normalizar_tempo(tempo_texto):
    if not tempo_texto:
        return None
    tempo_texto = tempo_texto.lower().strip()
    if "pá-pum" in tempo_texto or "pa-pum" in tempo_texto:
        return 20
    elif "até 1h" in tempo_texto or tempo_texto == "1h":
        return 60
    elif "até 2h" in tempo_texto:
        return 120
    elif "mais de 2h" in tempo_texto:
        return 150
    elif "mais de 1h" in tempo_texto:
        return 90
    combinado = re.search(r"(\d+)\s*h\s*(\d+)?", tempo_texto)
    if combinado:
        h = int(combinado.group(1))
        m = int(combinado.group(2)) if combinado.group(2) else 0
        return h * 60 + m
    minutos = re.search(r"(\d+)\s*min", tempo_texto)
    return int(minutos.group(1)) if minutos else None

def parse_porcoes(texto):
    if not texto:
        return 1
    nums = re.findall(r'\d+', texto)
    return int(nums[-1]) if nums else 1

# ==============================
# 🍳 DETECÇÃO DE UTENSÍLIOS
# ==============================
UTENSILIOS_CONHECIDOS = [
    "frigideira", "panela", "assadeira", "tigela", "colher", "batedeira",
    "liquidificador", "forno", "espátula", "ralador", "faca", "peneira",
    "escumadeira", "concha", "tábua", "garfo", "prato", "forma", "tabuleiro"
]

def detectar_utensilios(passos):
    texto = " ".join(passos).lower()
    encontrados = [u.capitalize() for u in UTENSILIOS_CONHECIDOS if u in texto]
    return list(set(encontrados))

# ==============================
# 🍎 CLASSIFICAÇÃO E FILTROS
# ==============================
def classificar_categoria(nome, ingredientes, modo_preparo):
    # 🔧 Garante que ingredientes e modo_preparo sejam texto
    if isinstance(ingredientes, list):
        ingredientes = " ".join(ingredientes)
    if isinstance(modo_preparo, list):
        modo_preparo = " ".join(modo_preparo)

    texto = f"{nome.lower()} {ingredientes.lower()} {modo_preparo.lower()}"

    # ⚠️ Remove termos genéricos que causam falsos positivos
    ignorar = [
        "colher de sopa", "colheres de sopa",
        "colher de chá", "colheres de chá",
        "páprica doce", "folhas de coentro",
        "pimenta-do-reino", "sal a gosto",
        "azeite", "óleo", "água"
    ]
    for termo in ignorar:
        texto = texto.replace(termo, "")

    # 🍗 Pratos principais / proteicos
    if any(t in texto for t in [
        "frango", "carne", "peixe", "tofu", "ovo",
        "mignon", "proteína", "bife", "assado",
        "grelhado", "cozido"
    ]):
        return "Pratos Proteicos"

    # 🍚 Acompanhamentos
    if any(t in texto for t in [
        "arroz", "feijão", "lentilha", "grão-de-bico",
        "grão de bico", "batata", "mandioca", "purê",
        "polenta", "farofa", "vinagrete"
    ]):
        return "Acompanhamentos"

    # 🥗 Saladas
    if "salada" in nome.lower() or "salada" in texto:
        return "Saladas"

    # 🍰 Bolos e doces
    if any(t in texto for t in [
        "bolo", "torta", "sobremesa", "doce",
        "brigadeiro", "tapioca", "compota",
        "pudim", "crumble", "mousse"
    ]):
        return "Doces"

    # 🍝 Massas
    if any(t in texto for t in [
        "macarrão", "espaguete", "massa", "lasanha",
        "nhoque", "ravioli", "fettuccine", "penne"
    ]):
        return "Massas"

    # ☕ Bebidas
    if any(t in texto for t in [
        "suco", "vitamina", "smoothie", "milkshake",
        "café", "chá", "drink", "coquetel", "bellini",
        "gelado", "refrescante", "bebida"
    ]):
        return "Bebidas"

    # 🥣 Sopas e caldos (mas evita falsos positivos)
    if any(t in texto for t in ["sopa", "caldo", "ensopado", "creme de", "sopa fria"]):
        # ⛔ Evita doces, bebidas, pães, granola, etc.
        if any(bad in texto for bad in [
            "iogurte", "granola", "pão", "smoothie", "manga",
            "banana", "aveia", "muesli", "crumble", "gelado",
            "bebida", "vitamina", "fruta"
        ]):
            return "Diversos"
        return "Sopas e Caldos"

    # 🍞 Diversos (pães, granola, etc)
    if any(t in texto for t in [
        "pão", "granola", "aveia", "quinoa", "cuscuz",
        "muesli", "focaccia", "torrada", "picles"
    ]):
        return "Diversos"

    # ♻️ Reaproveitamento
    if "reaproveitamento" in nome.lower():
        return "Reaproveitamento"

    # 🔄 Caso não se encaixe em nenhuma
    return "Outros"


INGREDIENTES_ULTRAPROCESSADOS = [
    "refrigerante", "margarina", "creme de leite", "leite condensado",
    "salsicha", "presunto", "mortadela", "salgadinho", "macarrão instantâneo"
]

def eh_saudavel(ingredientes):
    texto = " ".join(ingredientes).lower()
    return not any(p in texto for p in INGREDIENTES_ULTRAPROCESSADOS)

# ==============================
# 💾 INSERÇÃO NO BANCO
# ==============================
def inserir_categoria(cursor, nome_categoria):
    cursor.execute("SELECT id_categorias FROM categorias WHERE nome=%s", (nome_categoria,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute("INSERT INTO categorias (nome) VALUES (%s)", (nome_categoria,))
    return cursor.lastrowid

def inserir_ingrediente(cursor, nome):
    cursor.execute("SELECT id_ingrediente FROM ingredientes WHERE nome=%s", (nome,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute("INSERT INTO ingredientes (nome) VALUES (%s)", (nome,))
    return cursor.lastrowid

def inserir_utensilio(cursor, nome):
    cursor.execute("SELECT id_utensilio FROM utensilios WHERE nome=%s", (nome,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute("INSERT INTO utensilios (nome) VALUES (%s)", (nome,))
    return cursor.lastrowid

def salvar_receitas_no_banco(conn, receitas, termo):
    cursor = conn.cursor(buffered=True)
    for r in receitas:
        try:
            if not eh_saudavel(r["ingredientes"]):
                print(f"🚫 {r['nome']} descartada (ultraprocessado).")
                continue

            categoria = classificar_categoria(
                r.get("nome", ""),
                r.get("ingredientes", ""),
                r.get("modo_preparo", "")
            )

            id_categoria = inserir_categoria(cursor, categoria)
            id_ingrediente_base = inserir_ingrediente(cursor, termo)

            cursor.execute("SELECT id_receitas FROM receitas WHERE nome=%s", (r["nome"],))
            if cursor.fetchone():
                print(f"⚠️ Receita já existente: {r['nome']}")
                continue

            cursor.execute("""
                INSERT INTO receitas
                (nome, descricao, porcoes, custo_aproximado, idDificuldade, id_categoria,
                 id_ingrediente_base, tempo_preparo, imagem)
                VALUES (%s, %s, %s, NULL, NULL, %s, %s, %s, %s)
            """, (
                r["nome"],
                r["descricao"],
                r["porcoes_int"],
                id_categoria,
                id_ingrediente_base,
                r["tempo_preparo"],
                r["imagem"]
            ))
            id_receita = cursor.lastrowid

            for ing in r["ingredientes"]:
                id_ing = inserir_ingrediente(cursor, limpar_ingrediente(ing))
                cursor.execute("""
                    INSERT INTO receita_ingredientes (id_ingrediente, id_receitas, quantidade, unidade)
                    VALUES (%s, %s, NULL, NULL)
                """, (id_ing, id_receita))

            for ut in r["utensilios"]:
                id_ut = inserir_utensilio(cursor, ut)
                cursor.execute("""
                    INSERT INTO receita_utensilios (id_receitas, id_utensilio)
                    VALUES (%s, %s)
                """, (id_receita, id_ut))

            for idx, passo in enumerate(r["preparo"], 1):
                cursor.execute("""
                    INSERT INTO receita_passos (id_receitas, descricao, ordem)
                    VALUES (%s, %s, %s)
                """, (id_receita, passo, idx))

            conn.commit()
            print(f"💾 Receita salva: {r['nome']} ({categoria})")

        except Error as e:
            conn.rollback()
            print(f"❌ Erro ao salvar {r['nome']}: {e}")

# ==============================
# 🤖 COLETA VIA SELENIUM
# ==============================
def coletar_panelinha_selenium(termo, max_receitas=15):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(options=options)

    url = f"https://panelinha.com.br/busca?query={termo}&page=1"
    driver.get(url)
    time.sleep(3)

    cards = driver.find_elements(By.CSS_SELECTOR, "a[href*='/receita/']")
    links = list({c.get_attribute("href") for c in cards if "/receita/" in c.get_attribute("href")})
    links = links[:max_receitas]

    receitas = []
    for link in links:
        try:
            driver.get(link)
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
            time.sleep(1.2)

            nome = driver.find_element(By.CSS_SELECTOR, "h1.headerRecipeImageH1, h1.tH2").text.strip()

            descricao = "Sem descrição"
            if driver.find_elements(By.CSS_SELECTOR, "p.mbB2.psB1-oM.tSt3"):
                descricao = driver.find_element(By.CSS_SELECTOR, "p.mbB2.psB1-oM.tSt3").text.strip()

            tempo_texto = ""
            if driver.find_elements(By.XPATH, "//dt[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÃÕÇ', 'abcdefghijklmnopqrstuvwxyzáéíóúãõç'), 'tempo')]/following-sibling::dd"):
                tempo_texto = driver.find_element(By.XPATH, "//dt[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÃÕÇ', 'abcdefghijklmnopqrstuvwxyzáéíóúãõç'), 'tempo')]/following-sibling::dd").text.strip()
            tempo_preparo = normalizar_tempo(tempo_texto)

            porcoes_texto = ""
            if driver.find_elements(By.XPATH, "//dt[contains(text(),'Serve')]/following-sibling::dd"):
                porcoes_texto = driver.find_element(By.XPATH, "//dt[contains(text(),'Serve')]/following-sibling::dd").text.strip()
            porcoes_int = parse_porcoes(porcoes_texto)

            ingredientes = [limpar_ingrediente(i.text) for i in driver.find_elements(By.CSS_SELECTOR, ".blockIngredientListingsctn li")]
            preparo = [p.text.strip() for p in driver.find_elements(By.CSS_SELECTOR, "ol.olStd li") if p.text.strip()]
            utensilios = detectar_utensilios(preparo)

            imagem = None
            if driver.find_elements(By.CSS_SELECTOR, "img.imgRe"):
                img_elem = driver.find_element(By.CSS_SELECTOR, "img.imgRe")
                imagem = img_elem.get_attribute("src") or (img_elem.get_attribute("srcset") or "").split(",")[-1].split()[0].strip()

            receitas.append({
                "nome": nome,
                "descricao": descricao,
                "tempo_preparo": tempo_preparo,
                "porcoes_int": porcoes_int,
                "ingredientes": ingredientes,
                "preparo": preparo,
                "utensilios": utensilios,
                "imagem": imagem
            })

            print(f"🍴 Coletada: {nome}")

        except Exception as e:
            print(f"⚠️ Erro ao coletar receita ({link}): {e}")

    driver.quit()
    return receitas

# ==============================
# 🏁 EXECUÇÃO
# ==============================
if __name__ == "__main__":
    conn = conectar_mysql()

    termos = [
        # 🥩 Pratos proteicos
        "frango", "carne moída", "peixe", "ovo", "tofu",

        # 🍚 Acompanhamentos
        "arroz integral", "feijão", "lentilha", "grão de bico", "batata",

        # 🥗 Saladas
        "salada de folhas", "salada de legumes", "salada de frutas",

        # 🍝 Massas
        "macarrão", "espaguete", "lasanha", "nhoque", "massa caseira",

        # 🍰 Doces e sobremesas
        "bolo de cenoura", "bolo de chocolate", "sobremesa", "doce", "torta",
  
        # 🍹 Bebidas e vitaminas
        "suco natural", "vitamina de banana", "chá gelado", "smoothie",

        # 🌾 Integrais e saudáveis
        "aveia", "granola", "pão integral", "cuscuz", "quinoa",

        # 🌽 Legumes e verduras
        "legumes", "verduras", "abóbora", "brócolis", "espinafre", "couve"
    ]


    for termo in termos:
        print(f"\n🍽️ Coletando receitas de {termo}...")
        receitas = coletar_panelinha_selenium(termo, max_receitas=15)
        if receitas:
            salvar_receitas_no_banco(conn, receitas, termo)
        else:
            print(f"⚠️ Nenhuma receita encontrada para {termo}")

    conn.close()
    print("\n✅ Coleta finalizada com sucesso!")
