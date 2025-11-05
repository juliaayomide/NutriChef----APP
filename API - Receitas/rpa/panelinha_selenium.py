from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import mysql.connector
from mysql.connector import Error
import time
import re

# =========================
# CONFIGURAÇÃO DO MYSQL
# =========================
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

# =========================
# INSERÇÃO DE CATEGORIA
# =========================
def inserir_categoria(cursor, categoria):
    cursor.execute("SELECT id_categorias FROM categorias WHERE nome=%s", (categoria,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute("INSERT INTO categorias (nome) VALUES (%s)", (categoria,))
    return cursor.lastrowid

# =========================
# INSERÇÃO DE INGREDIENTE
# =========================
def inserir_ingrediente(cursor, nome):
    cursor.execute("SELECT id_ingrediente FROM ingredientes WHERE nome=%s", (nome,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute("INSERT INTO ingredientes (nome) VALUES (%s)", (nome,))
    return cursor.lastrowid

# =========================
# COLETAR RECEITAS PANELINHA
# =========================
def coletar_panelinha_selenium(termo, max_receitas=5):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    service = Service(executable_path=r"C:\Users\DEL\Desktop\API - Receitas\rpa\chromedriver.exe")
    driver = webdriver.Chrome(service=service, options=options)

    url = f"https://www.panelinha.com.br/busca?query={termo}"
    print(f"🔎 Acessando {url}...")
    driver.get(url)

    receitas = []

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a[href*='/receita/']"))
        )
        cards = driver.find_elements(By.CSS_SELECTOR, "a[href*='/receita/']")
        print(f"🔍 {len(cards)} receitas encontradas.")

        links_receitas = []
        for card in cards[:max_receitas]:
            link = card.get_attribute("href")
            if link and "/receita/" in link and link not in links_receitas:
                links_receitas.append(link)

        if not links_receitas:
            print("⚠️ Nenhuma receita encontrada após filtragem.")
            driver.quit()
            return receitas

        for link in links_receitas:
            try:
                driver.get(link)
                print(f"➡️ Coletando: {link}")
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "h1"))
                )
                time.sleep(2)

                # Nome
                try:
                    nome = driver.find_element(By.CSS_SELECTOR, "h1.headerRecipeImageH1, h1.tH2").text.strip()
                except:
                    nome = "Sem nome"

                # Descrição
                try:
                    descricao = driver.find_element(By.CSS_SELECTOR, "p.mbB2.psB1-oM.tSt3").text.strip()
                except:
                    descricao = ""

                # Porções
                try:
                    porcoes_texto = driver.find_element(By.XPATH, "//dt[contains(text(),'Serve')]/following-sibling::dd").text.strip()
                    numeros = re.findall(r'\d+', porcoes_texto)
                    porcoes = int(numeros[0]) if numeros else 1
                except:
                    porcoes = 1

                # Ingredientes
                ingredientes = []
                try:
                    items = driver.find_elements(By.CSS_SELECTOR, "div.blockIngredientListingsctn ul li")
                    for li in items:
                        texto = li.text.strip()
                        if texto:
                            ingredientes.append(texto)
                except:
                    pass

                # Modo de preparo
                passos = []
                try:
                    itens_prep = driver.find_elements(By.CSS_SELECTOR, "div.psB1-oM ol.olStd li")
                    for p in itens_prep:
                        texto = p.text.strip()
                        if texto:
                            passos.append(texto)
                except:
                    pass

                # Imagem
                try:
                    imagem = driver.find_element(By.CSS_SELECTOR, "img.headerRecipeImage").get_attribute("src")
                except:
                    imagem = ""

                receitas.append({
                    "nome": nome,
                    "descricao": descricao,
                    "porcoes": porcoes,
                    "categoria": "Automático",
                    "ingredientes": ingredientes,
                    "passos": passos,
                    "imagem": imagem,
                    "link": link
                })

                print(f"✅ {nome} coletada com {len(ingredientes)} ingredientes e {len(passos)} passos.")

            except Exception as e:
                print(f"❌ Erro ao coletar receita ({link}): {e}")

    finally:
        driver.quit()

    return receitas

# =========================
# SALVAR RECEITAS NO BANCO
# =========================
def salvar_receitas_no_banco(conn, receitas, ingrediente_base):
    cursor = conn.cursor(buffered=True)  # <-- corrige "Unread result found"
    for r in receitas:
        try:
            id_categoria = inserir_categoria(cursor, r["categoria"])
            id_ingrediente_base = inserir_ingrediente(cursor, ingrediente_base)

            # Evita duplicar receitas
            cursor.execute("SELECT id_receitas FROM receitas WHERE nome=%s", (r["nome"],))
            if cursor.fetchone():
                print(f"⚠️ Receita já existente: {r['nome']}")
                continue

            cursor.execute("""
                INSERT INTO receitas
                (nome, descricao, porcoes, custo_aproximado, idDificuldade, id_categoria, id_ingrediente_base, tempo_preparo, imagem)
                VALUES (%s, %s, %s, NULL, NULL, %s, %s, NULL, %s)
            """, (r["nome"], r["descricao"], r["porcoes"], id_categoria, id_ingrediente_base, r["imagem"]))
            id_receita = cursor.lastrowid

            # Ingredientes
            for ing in r["ingredientes"]:
                id_ing = inserir_ingrediente(cursor, ing)
                cursor.execute("""
                    INSERT INTO receita_ingredientes (id_ingrediente, id_receitas, quantidade, unidade)
                    VALUES (%s, %s, NULL, NULL)
                """, (id_ing, id_receita))

            # Passos
            for idx, passo in enumerate(r["passos"], 1):
                cursor.execute("""
                    INSERT INTO receita_passos (id_receitas, descricao, ordem)
                    VALUES (%s, %s, %s)
                """, (id_receita, passo, idx))

            conn.commit()
            print(f"💾 Receita salva no banco: {r['nome']}")

        except Error as e:
            conn.rollback()
            print(f"❌ Erro ao salvar {r['nome']}: {e}")

# =========================
# EXECUÇÃO PRINCIPAL
# =========================
if __name__ == "__main__":
    conn = conectar_mysql()
    termo = input("Digite o ingrediente ou nome da receita: ").strip()
    receitas = coletar_panelinha_selenium(termo, max_receitas=6)
    if receitas:
        print(f"✅ {len(receitas)} receitas coletadas com sucesso.")
        salvar_receitas_no_banco(conn, receitas, termo)
    else:
        print("⚠️ Nenhuma receita coletada.")
    conn.close()
    print("🏁 Conexão encerrada. Script finalizado.")
