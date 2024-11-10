export const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      await requestHandler(req, res, next);
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        errors: error.errors || [],
      });
    }
  };
};
