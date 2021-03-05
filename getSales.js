const axios = require("axios");
const path = require("path");
const qs = require("qs");
const puppeteer = require("puppeteer");
const { promises: fs } = require("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

setCookie = async () => {
  let username = `prime`;
  let password = `FARtessy2019`;

  let cookie;
  let url = "https://www.primepharmacy.gr/advisable/login.htm";
  let browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
    });
  let page = await browser.newPage();
 
  await page.setViewport({
    width: 1980,
    height: 1080,
  });

  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  try {
    await page.waitForSelector("#js-login-form");
    await page.$eval(
      "input[name=username]",
      (el, username) => {
        el.value = username;
      },
      username
    );
    await page.$eval(
      "input[name=pwd]",
      (el, password) => {
        el.value = password;
      },
      password
    );
    await page.click('input[type="submit"]');
    let cookies = await page.cookies();
    cookie = `${cookies[0].name}=${cookies[0].value}`;

    fs.writeFile(
      path.resolve(__dirname, "./cookie.txt"),
      cookie,
      "utf8",
      (err) => {
        if (err) console.error(err);
      }
    );
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
};

getSales = async (date_start, date_end, product) => {
  try {
    let cookie = "";

    await (async () => {
      try {
        let file = await fs.readFile(
          path.resolve(__dirname, "./cookie.txt"),
          "utf-8"
        );
        cookie = file;
      } catch (e) {
        console.log("e", e);
      }
    })();

    console.log(cookie);
    const data = qs.stringify({
      date_start: date_start,
      date_end: date_end,
      timespan: "1y",
      limit: "1",
      report_type: "1",
      chart_type: "1",
      "product_ids[]": product,
      submit: "Αναφορά",
    });

    console.log(data);

    const config = {
      method: "post",
      url:
        "https://www.primepharmacy.gr/eshop/reporting/products_timespans.htm",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
      withCredentials: true,
    };

    const response = await axios(config);
    //console.log(response)
    const dom = new JSDOM(await response.data);
    const heading = dom.window.document.querySelector('#page-heading > h1')
    console.log(heading.textContent)
    if(dom.window.document.querySelector(
      "#tblDataReport > tbody > tr > td > strong "
    )) {const result = dom.window.document.querySelector(
        "#tblDataReport > tbody > tr > td > strong "
      ).textContent;
      let num = parseInt(result.split("\n")[3]);
      console.log(`Result: ${num}`);
      return num;
    }else {
      return 0
    }
    
  } catch {
    await setCookie();
    let result = await this.getSales(date_start, date_end, product);
    return result;
  }
};

exports.getSales = getSales;
