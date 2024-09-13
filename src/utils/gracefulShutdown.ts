export async function gracefulShutdown(signal: string) {
  console.log(`Received signal to terminate: ${signal}`);

  // --- Выполни здесь все необходимые действия перед завершением работы:

  // 1. Закрой соединения с базой данных
  // await dbConnection.close();

  // 2. Заверши работу с другими ресурсами (файлы, сетевые сокеты)

  // 3. Выполни другие задачи очистки

  // ---

  console.log('Gracefully shutting down...');
  process.exit(0);
}