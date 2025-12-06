/**
 * Error messages for user-facing alerts
 */
export const ErrorMessages = {
  SAVE_FAILED: 'Failed to save card. Please try again.',
  SHARE_FAILED: 'Failed to share the QR card. Please try again.',
  LOAD_FAILED: 'Failed to load saved cards.',
  DELETE_FAILED: 'Failed to delete card. Please try again.',
  PERMISSION_DENIED: 'Permission denied. Please grant the required permissions in settings.',
  CAMERA_ERROR: 'Camera error occurred. Please try again.',
  INVALID_QR_CODE: 'Invalid QR code detected. Please scan again.',
};

/**
 * Success messages for user-facing alerts
 */
export const SuccessMessages = {
  SAVED_TO_GALLERY: 'Card saved to History & Gallery!',
  SAVED_TO_APP: 'Card saved to internal History.',
  DELETED: 'Card deleted successfully.',
};

/**
 * Create a user-friendly error message
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default message if error is not recognized
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (error?.message) {
    // Check for specific error types
    if (error.message.includes('permission')) {
      return ErrorMessages.PERMISSION_DENIED;
    }
    if (error.message.includes('camera')) {
      return ErrorMessages.CAMERA_ERROR;
    }
    return error.message;
  }
  return defaultMessage;
};

