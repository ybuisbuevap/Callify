const server =
  process.env.NODE_ENV === "production"
    ? "https://callify-backend-709m.onrender.com"
    : "http://localhost:8000";

export default server;