from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Check desktop
        page_desktop = browser.new_page(viewport={"width": 1200, "height": 800})
        # Note: I'll use the specific path to directly see /inicio
        page_desktop.goto("http://localhost:5173/inicio")
        page_desktop.wait_for_timeout(3000)

        # Take a screenshot specifically of the bottom part of the page where the cards are
        page_desktop.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page_desktop.wait_for_timeout(1000)
        page_desktop.screenshot(path="desktop_cards_bottom.png", full_page=False)

        # Check mobile
        page_mobile = browser.new_page(viewport={"width": 400, "height": 800})
        page_mobile.goto("http://localhost:5173/inicio")
        page_mobile.wait_for_timeout(3000)

        page_mobile.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page_mobile.wait_for_timeout(1000)
        page_mobile.screenshot(path="mobile_cards_bottom.png", full_page=False)

        browser.close()

if __name__ == "__main__":
    verify()
