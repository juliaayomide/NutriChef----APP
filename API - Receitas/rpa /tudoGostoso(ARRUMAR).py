from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

def buscar_receitas_tudogostoso(termo):
    url = f"https://www.tudogostoso.com.br/busca?q={termo}"
    print(f"🔎 Acessando {url}...")

    # Configurações do navegador
    options = Options()
    # ⚠️ Deixe headless comentado por enquanto pra visualizar
    # options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=options)
    driver.get(url)

    try:
        # Espera até que os cards estejam visíveis
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.card.card-recipe"))
        )

        # Faz rolagem até o final da página (para garantir carregamento)
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

    except Exception as e:
        print("⚠️ Nenhum resultado carregado na página.")
        print(e)
        driver.quit()
        return

    # Extrai o HTML renderizado
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    receitas = []
    cards = soup.select("div.card.card-recipe")

    for item in cards:
        titulo_el = item.select_one("strong.card-title a")
        nome = titulo_el.text.strip() if titulo_el else "Sem nome"
        link = titulo_el["href"] if titulo_el else None

        img_el = item.select_one("picture img")
        imagem = img_el["src"] if img_el else None

        receitas.append({
            "nome": nome,
            "link": link,
            "imagem": imagem
        })

    if not receitas:
        print("⚠️ Nenhuma receita encontrada.")
    else:
        print(f"✅ {len(receitas)} receitas encontradas:\n")
        for r in receitas:
            print(f"- {r['nome']}")
            print(f"  🔗 {r['link']}")
            print(f"  🖼️ {r['imagem']}\n")


if __name__ == "__main__":
    termo = input("Digite o ingrediente ou nome da receita: ")
    buscar_receitas_tudogostoso(termo)
