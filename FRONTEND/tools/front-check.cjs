const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apiResponses = [];

  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      apiResponses.push({
        url: response.url().replace("http://127.0.0.1:8000/api", ""),
        status: response.status(),
      });
    }
  });

  await page.goto("http://localhost:5174/login");
  await page.evaluate((token) => {
    localStorage.setItem("access", token);
    localStorage.setItem("refresh", "front-check");
  }, process.env.ACCESS_TOKEN);

  const paths = ["/", "/vehicles", "/operations", "/parkings", "/finance", "/users"];

  for (const path of paths) {
    await page.goto(`http://localhost:5174${path}`);
    await page.waitForLoadState("networkidle");
    const text = await page.locator("body").innerText();
    console.log(`${path} TEXT=${text.slice(0, 140).replace(/\s+/g, " ")}`);
  }

  const badResponses = apiResponses.filter((response) => response.status >= 400);

  console.log(`API_RESPONSES=${apiResponses.map((response) => `${response.url}:${response.status}`).join("|")}`);
  console.log(`API_BAD=${badResponses.length}`);

  await browser.close();

  if (badResponses.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
