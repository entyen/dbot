const { createCanvas } = require("canvas");
const GIFEncoder = require("gif-encoder-2");

const createRollingGif = async () => {
  const width = 200;
  const height = 200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const encoder = new GIFEncoder(width, height);

  encoder.start();
  encoder.setRepeat(-1);
  encoder.setDelay(100);
  encoder.setQuality(10);

  for (let i = 0; i < 27; i++) {
    const genNumber = Math.floor(Math.random() * 100) + 1;

    if (i === 26) {
      ctx.fillStyle = "#ffcccc";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 40px Arial";
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#000000";
      ctx.font = "30px Arial";
    }

    // Центрирование текста по горизонтали и вертикали
    const text = genNumber.toString();
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const xPosition = (width - textWidth) / 2; // Центрирование по горизонтали
    const yPosition = (height + textMetrics.actualBoundingBoxAscent) / 2; // Центрирование по вертикали

    ctx.fillText(text, xPosition, yPosition);
    encoder.addFrame(ctx);

    if (i === 26) {
      // Кадр с вспышкой
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      encoder.addFrame(ctx);

      // Увеличенный текст на финальном кадре
      ctx.fillStyle = "#ffcccc";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 50px Arial";
      const finalTextMetrics = ctx.measureText(text);
      const finalTextWidth = finalTextMetrics.width;
      const finalXPosition = (width - finalTextWidth) / 2;
      const finalYPosition = (height + finalTextMetrics.actualBoundingBoxAscent) / 2;
      ctx.fillText(text, finalXPosition, finalYPosition);
      encoder.addFrame(ctx);
    }
  }

  encoder.finish();

  // Получаем буфер GIF
  const buffer = encoder.out.getData();

  return buffer;
};

module.exports = { createRollingGif };
