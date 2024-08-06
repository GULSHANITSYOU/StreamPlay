class apiError extends Error {
  constructor(
    statusCode,
    massege = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(massege);
    this.statusCode = statusCode;
    this.massege = massege;
    this.errors = errors;
    this.succusse = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
