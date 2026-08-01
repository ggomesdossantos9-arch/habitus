export class JournalController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => res.json({ data: await this.service.list(req.user, req.validatedQuery) });
  create = async (req, res) => res.status(201).json({ data: await this.service.create(req.user, req.validated) });
  detail = async (req, res) => res.json({ data: await this.service.detail(req.user, req.validatedParams.entryId) });
  update = async (req, res) => res.json({ data: await this.service.update(req.user, req.validatedParams.entryId, req.validated) });
  complete = async (req, res) => res.json({ data: await this.service.complete(req.user, req.validatedParams.entryId) });
  delete = async (req, res) => { await this.service.delete(req.user, req.validatedParams.entryId); res.status(204).end(); };
}
