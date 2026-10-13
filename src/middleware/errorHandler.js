import logger from '../config/logger.js';

class BadRequestError extends Error {
  constructor(message, field) {
    super(message);
    this.statusCode = 400;
    this.errorCode = 'BAD_REQUEST';
    this.field = field;
    this.timestamp = new Date().toISOString();
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} no encontrada`);
    this.statusCode = 404;
    this.errorCode = 'NOT_FOUND';
    this.resource = resource;
    this.timestamp = new Date().toISOString();
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message || 'Conflicto en la solicitud');
    this.statusCode = 409;
    this.errorCode = 'CONFLICT';
    this.timestamp = new Date().toISOString();
  }
}

class InternalError extends Error {
  constructor(message) {
    super(message || 'Error interno del servidor');
    this.statusCode = 500;
    this.errorCode = 'INTERNAL_ERROR';
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Middleware de error handling centralizado
 */
const errorHandler = (err, req, res, next) => {
  // Log del error con Pino
  logger.error({
    error: err.message,
    errorCode: err.errorCode,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: err.timestamp || new Date().toISOString(),
    userId: req.params?.userId
  }, 'Error en request');

  // Evitar exponer stack traces al cliente
  if (err.statusCode >= 500) {
    logger.error({ stack: err.stack }, 'Stack trace del error');
  }

  // Construir respuesta consistente
  const errorResponse = {
    error: err.message,
    code: err.errorCode || 'UNKNOWN_ERROR',
    timestamp: err.timestamp || new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Agregar campo field si existe (para validaciones)
  if (err.field) {
    errorResponse.field = err.field;
  }

  // Agregar resource si existe (para NotFoundError)
  if (err.resource) {
    errorResponse.resource = err.resource;
  }

  // Enviar respuesta
  res.status(err.statusCode || 500).json(errorResponse);
};

export { BadRequestError, NotFoundError, ConflictError, InternalError, errorHandler };
