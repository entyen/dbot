const axios = require("axios");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");

async function parseImageForFindText(imageUrl) {
  try {
    // Загружаем изображение
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Проверяем, что данные были получены
    if (!response.data) {
      throw new Error("Получены пустые данные для изображения.");
    }

    const imageBuffer = Buffer.from(response.data);

    // Применяем фильтры для улучшения изображения
    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale()          // Переводим в черно-белое изображение
      .normalize()          // Увеличиваем контраст
      .sharpen()            // Повышаем резкость
      .toBuffer();          // Возвращаем результат как буфер

    // Распознаем текст
    const {
      data: { text },
    } = await Tesseract.recognize(processedImageBuffer, "eng", {
      logger: (m) => console.log(m),
    });

    return text;
  } catch (error) {
    console.error("Ошибка при обработке изображения:", error.message || error);
  }
}

module.exports = { parseImageForFindText };
