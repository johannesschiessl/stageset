import index from "./client/index.html";

console.log("Stageset");

Bun.serve({
  port: "44100",
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});
