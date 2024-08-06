class apiError extends Error {
  constructor(
    statusCode,
    massge = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.massge = massge;
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
