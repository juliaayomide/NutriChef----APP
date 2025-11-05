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
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="nutrichef"
    )

# ==============================
# 🧠 CLASSIFICAÇÃO AUTOMÁTICA
# ==============================
def classificar_categoria(nome, ingredientes):
    texto = (nome + " " + " ".join(ingredientes)).lower()

    if any(p in texto for p in ["bolo", "doce", "sobremesa"]):
        return "Doces"
    elif any(p in texto for p in ["sopa", "caldo", "ensopado"]):
        return "Sopas e Caldos"
    elif any(p in texto for p in ["suco", "vitamina", "chá"]):
        return "Bebidas"
    elif any(p in texto for p in ["massa", "macarrão", "lasanha", "nhoque"]):
        return "Massas"
    elif any(p in texto for p in ["carne", "frango", "bife", "peixe", "ovo"]):
        return "Pratos Proteicos"
    elif any(p in texto for p in ["salada", "verdura", "legume"]):
        return "Saladas"
    else:
        return "Diversos"

# ==============================
# 🚫 FILTRAGEM DE ULTRAPROCESSADOS
# ==============================
INGREDIENTES_ULTRAPROCESSADOS = [
    "refrigerante", "margarina", "creme de leite", "leite condensado",
    "salsicha", "presunto", "mortadela", "salgadinho", "macarrão instantâneo"
]

def eh_saudavel(ingredientes):
    texto = " ".join(ingredientes).lower()
    return not any(p in texto for p in INGREDIENTES_ULTRAPROCESSADOS)

# ==============================
# 🔧 FUNÇÕES AUXILIARES
# ==============================
def limpar_ingrediente(texto):
    """Remove prefixos 'null', ícones e espaços extras."""
    texto = re.sub(r'^[^\w]+', '', texto)
    texto = texto.replace("null", "").strip()
    return texto

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

    horas = re.search(r"(\d+)\s*h", tempo_texto)
    minutos = re.search(r"(\d+)\s*min", tempo_texto)
    total = 0

    if horas:
        total += int(horas.group(1)) * 60
    if minutos:
        total += int(minutos.group(1))

    combinado = re.search(r"(\d+)\s*h.*?(\d+)\s*min", tempo_texto)
    if combinado:
        return int(combinado.group(1)) * 60 + int(combinado.group(2))

    return total if total > 0 else None

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
    encontrados = [u for u in UTENSILIOS_CONHECIDOS if re.search(rf"\b{u}\b", texto)]
    return list(set(encontrados))

# ==============================
# 💾 INSERÇÃO NO BANCO
# ==============================
def inserir_categoria(cursor, nome_categoria):
    cursor.execute("SELECT id_categorias FROM categorias WHERE nome = %s", (nome_categoria,))
    resultado = cursor.fetchone()

    if resultado:
        return resultado[0]
    else:
        cursor.execute("INSERT INTO categorias (nome) VALUES (%s)", (nome_categoria,))
        return cursor.lastrowid

def salvar_receitas_no_banco(conn, receitas, termo):
    cursor = conn.cursor()
    for r in receitas:
        if not eh_saudavel(r["ingredientes"]):
            print(f"🚫 {r['nome']} descartada (ingredientes ultraprocessados)")
            continue

        categoria = classificar_categoria(r["nome"], r["ingredientes"])
        id_categoria = inserir_categoria(cursor, categoria)
        imagem = r.get("imagem") or "https://i.panelinha.com.br/i1/default.jpg"

        sql = """
        INSERT INTO receitas (nome, descricao, tempo_preparo, porcoes, id_categoria, imagem)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        valores = (
            r["nome"],
            "\n".join(r["preparo"]),
            r["tempo_preparo"],
            r["rendimento"],
            id_categoria,
            imagem
        )
        cursor.execute(sql, valores)
        conn.commit()
        print(f"✅ Receita '{r['nome']}' salva na categoria '{categoria}'")

# ==============================
# 🤖 COLETA VIA SELENIUM
# ==============================
def coletar_panelinha_selenium(termo, max_receitas=5):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(options=options)
    url_busca = f"https://panelinha.com.br/busca?query={termo}&page=1"
    driver.get(url_busca)
    time.sleep(3)

    cards = driver.find_elements(By.CSS_SELECTOR, "a[href*='/receita/']")
    links = []
    for card in cards:
        link = card.get_attribute("href")
        if link and "/receita/" in link and link not in links:
            links.append(link)
    links = links[:max_receitas]

    receitas = []
    for link in links:
        try:
            driver.get(link)
            WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
            time.sleep(2)

            nome = driver.find_element(By.CSS_SELECTOR, "h1.headerRecipeImageH1, h1.tH2").text.strip()

            tempo_texto = driver.find_element(By.XPATH, "//dt[contains(text(),'Tempo')]/following-sibling::dd").text if driver.find_elements(By.XPATH, "//dt[contains(text(),'Tempo')]") else ""
            tempo_preparo = normalizar_tempo(tempo_texto)

            rendimento = driver.find_element(By.XPATH, "//dt[contains(text(),'Serve')]/following-sibling::dd").text if driver.find_elements(By.XPATH, "//dt[contains(text(),'Serve')]") else "Não informado"

            ingredientes = [limpar_ingrediente(i.text) for i in driver.find_elements(By.CSS_SELECTOR, ".blockIngredientListingsctn li")]
            preparo = [p.text.strip() for p in driver.find_elements(By.CSS_SELECTOR, "ol.olStd li") if p.text.strip()]
            utensilios = detectar_utensilios(preparo)

            imagem = None
            if driver.find_elements(By.CSS_SELECTOR, "img.imgRe"):
                imagem = driver.find_element(By.CSS_SELECTOR, "img.imgRe").get_attribute("src")

            receitas.append({
                "nome": nome,
                "tempo_preparo": tempo_preparo,
                "rendimento": rendimento,
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
# 🏁 EXECUÇÃO AUTOMÁTICA
# ==============================
if __name__ == "__main__":
    conn = conectar_mysql()

    ALIMENTOS_SAUDAVEIS = [
        "arroz integral", "feijão", "frango", "peixe", "legumes",
        "verduras", "frutas", "aveia", "grão de bico", "lentilha", "ovo"
    ]

    for termo in ALIMENTOS_SAUDAVEIS:
        print(f"\n🍽️ Coletando receitas de {termo}...")
        receitas = coletar_panelinha_selenium(termo, max_receitas=5)
        if receitas:
            salvar_receitas_no_banco(conn, receitas, termo)
        else:
            print(f"⚠️ Nenhuma receita encontrada para {termo}")

    conn.close()
    print("\n✅ Coleta finalizada com sucesso!")
