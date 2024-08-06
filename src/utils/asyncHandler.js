const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// +++++++++++ async syntax ++++++++++++++
{
  /*
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    req.status(error.code || 500).json({
      success: false,
      massge: error.massge,
    });
  }
};
*/
}

export { asyncHandler };
