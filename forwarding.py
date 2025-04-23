from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time
import pandas as pd
import subprocess


def kill_brave():
    subprocess.run(
        ["pkill", "-f", "brave"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print("Killed all Brave processes.")


def start_brave():
    subprocess.Popen(
        [
            "brave-browser",
            "--remote-debugging-port=9222",
            "--auto-open-devtools-for-tabs",
        ]
    )
    print("Started Brave with remote debugging and DevTools open.")
    time.sleep(5)


def forward_message_to_batch(driver, contacts_batch):
    wait = WebDriverWait(driver, 10)
    actions = ActionChains(driver)

    try:
        # Step 1: Open "KPIT Om" chat and get last message
        search_box = wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    "//div[@contenteditable='true' and @role='textbox' and @aria-label='Search input textbox']",
                )
            )
        )
        search_box.clear()
        actions.key_down(Keys.CONTROL).send_keys("a").key_up(Keys.CONTROL).send_keys(
            Keys.DELETE
        ).perform()
        search_box.send_keys("KPIT Om")
        search_box.send_keys(Keys.ENTER)
        time.sleep(2)

        messages = wait.until(
            EC.presence_of_all_elements_located(
                (
                    By.XPATH,
                    "//div[contains(@class, 'message-in') or contains(@class, 'message-out')]",
                )
            )
        )
        last_message = messages[-1]
        actions.move_to_element(last_message).perform()
        time.sleep(1)

        dropdown_menu = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//div[@data-js-context-icon='true' and @aria-label='Context menu' and @role='button']",
                )
            )
        )
        dropdown_menu.click()
        time.sleep(1)

        forward_option = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//div[text()='Forward' or @aria-label='Forward']")
            )
        )
        forward_option.click()
        time.sleep(1)

        forward_button = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//span[@data-testid='forward' or @aria-label='Forward' or contains(@data-icon, 'forward')]",
                )
            )
        )
        forward_button.click()
        time.sleep(2)

        forward_search_box = wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    "//div[@aria-label='Search' and @role='textbox' and contains(@class, 'x1k6rcq7')]",
                )
            )
        )

        for contact in contacts_batch:
            forward_search_box.clear()
            actions.key_down(Keys.CONTROL).send_keys("a").key_up(
                Keys.CONTROL
            ).send_keys(Keys.DELETE).perform()
            forward_search_box.send_keys(str(contact))
            time.sleep(1.5)
            forward_search_box.send_keys(Keys.ENTER)
            time.sleep(1.5)

        # Try clicking the send button
        send_button = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//span[@aria-label='Send' and @data-icon='send']/ancestor::div[@role='button']",
                )
            )
        )

        try:
            driver.execute_script("arguments[0].click();", send_button)
            time.sleep(5)
            return True  # Success!
        except Exception as e:
            print(f"Click failed: {e}")
            raise e  # Will be caught below

    except Exception as e:
        print(f"Error occurred: {e}")
        print("Sending ESCAPE and retrying this batch...")
        actions.send_keys(Keys.ESCAPE).perform()
        time.sleep(2)
        actions.send_keys(Keys.ESCAPE).perform()
        time.sleep(2)
        actions.send_keys(Keys.ESCAPE).perform()
        return False  # Signal failure for retry


def safe_click(driver, element):
    for attempt in range(3):
        try:
            element.click()
            return True
        except:
            time.sleep(1)
            try:
                driver.execute_script("arguments[0].click();", element)
                return True
            except:
                time.sleep(1)
    return False


# Main execution
def main():
    # kill_brave()
    # start_brave()
    excel_path = "/home/omc1/Documents/om/avanimitra/prompt/users_17th April.xlsx"
    df = pd.read_excel(excel_path)
    phone_numbers = df["phone_number"].tolist()

    chrome_options = Options()
    chrome_options.binary_location = "/usr/bin/brave-browser"
    chrome_options.debugger_address = "127.0.0.1:9222"
    chromedriver_path = "/home/omc1/Documents/chromedriver-linux64/chromedriver"
    service = Service(chromedriver_path)

    driver = webdriver.Chrome(service=service, options=chrome_options)
    # driver.get("https://web.whatsapp.com/")
    time.sleep(10)

    batch_size = 5
    batches = [
        phone_numbers[i : i + batch_size]
        for i in range(0, len(phone_numbers), batch_size)
    ]

    i = 0
    while i < len(batches):
        batch = batches[i]
        print(f"Processing batch {i+1} of {len(batches)}: {batch}")
        success = forward_message_to_batch(driver, batch)
        if success:
            i += 1
        else:
            i -= 1
            print(f"Retrying batch {i+1}...")
            driver.get("https://web.whatsapp.com/")
            time.sleep(10)
    print("All batches processed successfully!")


if __name__ == "__main__":
    main()

# import subprocess
# import time
# import pandas as pd
# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.webdriver.common.by import By
# from selenium.webdriver.common.keys import Keys
# from selenium.webdriver.common.action_chains import ActionChains

# def kill_brave():
#     subprocess.run(["pkill", "-f", "brave"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
#     print("Killed all Brave processes.")

# def start_brave():
#     subprocess.Popen(["brave-browser", "--remote-debugging-port=9222", "--auto-open-devtools-for-tabs"])
#     print("Started Brave with remote debugging and DevTools open.")
#     time.sleep(5)

# def forward_message_to_batch(driver, contacts_batch):
#     wait = WebDriverWait(driver, 10)

#     search_box = wait.until(EC.presence_of_element_located((By.XPATH, "//div[@contenteditable='true' and @role='textbox' and @aria-label='Search input textbox']")))
#     search_box.clear()
#     search_box.click()
#     search_box.send_keys("KPIT Om")
#     search_box.send_keys(Keys.ENTER)
#     time.sleep(2)
#     print("Chat opened")

#     messages = wait.until(EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'message-in') or contains(@class, 'message-out')]")))
#     last_message = messages[-1]
#     print("Found last message")

#     actions = ActionChains(driver)
#     actions.move_to_element(last_message).perform()
#     time.sleep(1)

#     dropdown_menu = wait.until(
#         EC.element_to_be_clickable((By.XPATH, "//div[@data-js-context-icon='true' and @aria-label='Context menu' and @role='button']"))
#     )
#     dropdown_menu.click()
#     time.sleep(1)

#     forward_option = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[text()='Forward' or @aria-label='Forward']")))
#     forward_option.click()
#     time.sleep(1)

#     forward_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[@data-testid='forward' or @aria-label='Forward' or contains(@data-icon, 'forward')]")))
#     forward_button.click()
#     time.sleep(2)
#     print("Forward dialog opened")

#     forward_search_box = wait.until(EC.presence_of_element_located((By.XPATH, "//div[@aria-label='Search' and @role='textbox' and contains(@class, 'x1k6rcq7')]")))

#     for contact in contacts_batch:
#         print(f"Searching for contact: {contact}")
#         forward_search_box.clear()
#         actions.key_down(Keys.CONTROL).send_keys('a').key_up(Keys.CONTROL).send_keys(Keys.DELETE).perform()
#         forward_search_box.send_keys(str(contact))
#         time.sleep(1.5)
#         forward_search_box.send_keys(Keys.ENTER)
#         time.sleep(1.5)
#         print(f"Selected contact: {contact}")

#     send_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[@aria-label='Send' and @data-icon='send']/ancestor::div[@role='button']")))
#     send_button.click()
#     print(f"Message forwarded to batch: {contacts_batch}")
#     time.sleep(10)

# def process_batch(batch):
#     # Kill and start Brave
#     kill_brave()
#     start_brave()

#     chrome_options = Options()
#     chrome_options.binary_location = "/usr/bin/brave-browser"
#     chrome_options.debugger_address = "127.0.0.1:9222"

#     chromedriver_path = "/home/omc1/Documents/chromedriver-linux64/chromedriver"
#     service = Service(chromedriver_path)

#     driver = webdriver.Chrome(service=service, options=chrome_options)
#     driver.get("https://web.whatsapp.com/")
#     time.sleep(5)

#     # Open DevTools using Ctrl+Shift+I
#     actions = ActionChains(driver)
#     actions.key_down(Keys.CONTROL).key_down(Keys.SHIFT).send_keys('i').key_up(Keys.SHIFT).key_up(Keys.CONTROL).perform()
#     print("Opened DevTools")
#     time.sleep(2)

#     forward_message_to_batch(driver, batch)

#     driver.quit()
#     print("Closed browser after batch processing.")
#     time.sleep(2)


# def main():
#     excel_path = "/home/omc1/Documents/om/avanimitra/prompt_3_April_contacts.xlsx"
#     df = pd.read_excel(excel_path)
#     phone_numbers = df['phone_number'].tolist()

#     batch_size = 5
#     batches = [phone_numbers[i:i+batch_size] for i in range(0, len(phone_numbers), batch_size)]

#     for i, batch in enumerate(batches):
#         print(f"\nProcessing batch {i+1}/{len(batches)}")
#         process_batch(batch)

#     print("\nAll batches processed successfully!")

# if __name__ == "__main__":
#     main()
