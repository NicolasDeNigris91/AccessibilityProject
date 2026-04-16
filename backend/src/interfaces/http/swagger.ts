import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Web Accessibility Auditing Tool API",
      version: "0.1.0",
      description: "Enqueue and retrieve WCAG/axe-core accessibility audits.",
    },
    servers: [{ url: "/" }],
  },
  apis: ["./src/interfaces/http/routes/*.ts", "./dist/interfaces/http/routes/*.js"],
});

export function mountSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
  app.get("/openapi.json", (_req, res) => res.json(spec));
}
