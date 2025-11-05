from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

def buscar_receitas_panelinha(termo):
    url = f"https://www.panelinha.com.br/busca?query={termo}"

    print(f"🔎 Acessando {url}...")

    # Configurações do navegador (modo invisível)
    options = Options()
    options.add_argument("--headless=new")  # roda sem abrir janela
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    # Inicia o Chrome
    driver = webdriver.Chrome(options=options)
    driver.get(url)

    try:
        # Espera o conteúdo aparecer na tela (máximo 10 segundos)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "ais-Hits-item"))
        )
        time.sleep(1)  # garante que o JS terminou de montar a lista
    except:
        print("⚠️ Nenhum resultado carregado na página.")
        driver.quit()
        return

    # Pega o HTML renderizado
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    receitas = []
    for item in soup.select(".ais-Hits-item"):
        nome = item.select_one("h6.tSt")
        categoria = item.select_one("p.tTag")
        link = item.select_one("a")["href"] if item.select_one("a") else None
        imagem = item.select_one("img")["srcset"].split(" ")[0] if item.select_one("img") else None

        receitas.append({
            "nome": nome.text.strip() if nome else "Sem nome",
            "categoria": categoria.text.strip() if categoria else "Sem categoria",
            "link": f"https://www.panelinha.com.br{link}" if link else None,
            "imagem": imagem
        })

    if not receitas:
        print("⚠️ Nenhuma receita encontrada.")
    else:
        print(f"✅ {len(receitas)} receitas encontradas:\n")
        for r in receitas:
            print(f"- {r['nome']} ({r['categoria']})")
            print(f"  🔗 {r['link']}")
            print(f"  🖼️ {r['imagem']}\n")


if __name__ == "__main__":
    termo = input("Digite o ingrediente ou nome da receita: ")
    buscar_receitas_panelinha(termo)
