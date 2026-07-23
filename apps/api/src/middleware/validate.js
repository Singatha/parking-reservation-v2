export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    if (!result.success) {
      result.error.status = 400;
      return next(result.error);
    }
    req.validated = result.data;
    next();
  };
}
