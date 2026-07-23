import { ZodError } from "zod";

export function errorHandler(error, req, res, next) {
  void next;
  req.log?.error({ err: error }, "request failed");

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request contains invalid values",
        details: error.flatten()
      }
    });
  }

  const status = error.status ?? 500;
  res.status(status).json({
    error: {
      code: error.code ?? "INTERNAL_ERROR",
      message: status === 500 ? "An unexpected error occurred" : error.message
    }
  });
}
