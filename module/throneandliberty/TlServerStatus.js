const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://www.playthroneandliberty.com/en-gb/support/server-status";
const apiUrl = "https://throneandliberty.gameslantern.com/api/weather";

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
          status = "🟢";
        } else if (statusSvg.includes("FFF500")) {
          status = "🟠";
        } else if (statusSvg.includes("FF0000")) {
          status = "🔴";
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

const conditions = [
  {
    id: "EWeatherType::Normal",
    name: "Солнечно",
    emoji: "🌤️️",
  },
  {
    id: "EWeatherType::Rain",
    name: "Дождь",
    emoji: "🌧️",
  },
  {
    id: "EWeatherType::Snow",
    name: "Снег",
    emoji: "🌨️️",
  },
  {
    id: "EWeatherType::Indoor",
    name: "В Здании",
    emoji: "",
  },
];

const parseTlWeatherInfo = async (serverRegion) => {
  const responce = await axios.get(apiUrl, {
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const data = responce.data;
  const europeWeather = data.data[serverRegion];
  const currentState = europeWeather.find(
    (weather) => weather.ts <= Date.now()
  );
  const nextState = europeWeather.find((weather) => weather.ts >= Date.now());
  const nextStateCond = conditions.find(
    (condition) => condition.id === nextState.condition
  );
  const rainSchedush = {
    timeToState: Math.floor((nextState.ts - Date.now()) / 1000 / 60),
    stateName: nextStateCond,
  };
  const weatherCondition = conditions.find(
    (condition) => condition.id === currentState.condition
  );
  return {
    weather: `${weatherCondition?.name} ${weatherCondition?.emoji}`,
    untillRain: `${rainSchedush?.stateName?.name} через ${rainSchedush.timeToState} мин`,
  };
};

module.exports = { parseTlServerStatus, parseTlWeatherInfo };
