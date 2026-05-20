import { createApp } from "./create-app.js";

const app = await createApp();
const port = Number.parseInt(process.env.API_PORT ?? "3001", 10);

await app.listen(port);
