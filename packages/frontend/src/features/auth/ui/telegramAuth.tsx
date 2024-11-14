import { TelegramType } from "../types/telegramTypes";

export const TelegramAuth = () => {
  const Telegram = (window as any).Telegram as TelegramType;
  Telegram.WebApp.expand();
  const telegramParams = new URLSearchParams(Telegram.WebApp.initData);
  let params = Object.fromEntries(telegramParams.entries());
  if (!params.user) return window.open("https://grk.pw", "_self");
  const user = JSON.parse(params.user);

  console.log(user, params);
};
