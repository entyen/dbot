const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://www.playthroneandliberty.com/en-gb/support/server-status";
const apiUrl = "https://tldb.info/server-status/__data.json";

const parseTlServerStatus = async (serverName) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const europeServerDiv = $('div[data-regionid="europe"]');

    const serverSpans = europeServerDiv.find(
      "span.ags-ServerStatus-content-serverStatuses-server-item-label"
    );

    let statusTL;

    for (let i = 0; i < serverSpans.length; i++) {
      const element = serverSpans[i];
      const _serverName = $(element).text();
      if (_serverName === serverName) {
        const parentElement = $(element).closest("div");

        const statusSvg = parentElement.find("svg").html();

        let status;
        if (statusSvg.includes("24FF00")) {
          status = "🟢 Хорошо";
        } else if (statusSvg.includes("FFF500")) {
          status = "🟠 Занят";
        } else if (statusSvg.includes("FF0000")) {
          status = "🔴 Полный";
        } else if (statusSvg.includes("00F0FF")) {
          status = "🔵 На техобслуживании";
        } else {
          status = "⚪️ Неизвестно";
        }

        statusTL = { serverName: _serverName, status: status };
        break;
      }
    }

    return statusTL;
  } catch (error) {
    console.error("Ошибка при парсинге страницы:", error);
  }
};

const parseTlServerInfo = async (serverName) => {
  const responce = await axios.get(apiUrl);
  const data = responce.data;

  const servers = data.nodes
    .filter((node) => node?.type === "data")
    .flatMap((node) => node.data)
    .map((server) => ({
      name: server.name || "Unknown",
      status: server.status || "Unknown",
      region: server.region || "Unknown",
    }));

  console.log(servers);
};

module.exports = { parseTlServerStatus, parseTlServerInfo };
