export class Problem extends Error {
  constructor(status, code, detail, errors) { super(detail); this.status = status; this.code = code; this.errors = errors; }
}

export function notFound(req, _res, next) { next(new Problem(404, 'NOT_FOUND', 'Recurso não encontrado.')); }

export function errorHandler(error, req, res, _next) {
  const status = error.status ?? 500;
  if (status >= 500) req.log?.error({ err: error }, 'request_failed');
  res.status(status).type('application/problem+json').json({
    type: `https://api.habitus/errors/${error.code?.toLowerCase().replaceAll('_', '-') ?? 'internal'}`,
    title: status === 500 ? 'Erro interno' : error.code === 'VALIDATION_ERROR' ? 'Dados inválidos' : 'Não foi possível concluir a solicitação',
    status, code: status === 500 ? 'INTERNAL_ERROR' : error.code,
    detail: status === 500 ? 'Ocorreu um erro inesperado.' : error.message,
    requestId: req.id, ...(error.errors ? { errors: error.errors } : {}),
  });
}
