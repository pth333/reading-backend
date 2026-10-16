import app from "#src/app.js";

const PORT = Number(process.env.PORT ?? 8080);

const HOST = process.env.HOST ?? "::";

const server = app.listen(PORT, HOST, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Cổng ${PORT} đang bị tiến trình khác chiếm.`);
    process.exit(1);
  }

  throw error;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`\nNhận ${signal}, đang tắt server...`);
    server.close(() => process.exit(0));
  });
}
