export class EmotionController {
  constructor(service) {
    this.service = service;
  }

  catalog = async (_req, res) => res.json({ data: await this.service.listCatalog() });
  listEvents = async (req, res) => res.json({ data: await this.service.listEvents(req.user, req.validatedQuery) });
  createEvent = async (req, res) => res.status(201).json({ data: await this.service.createStandalone(req.user, req.validated) });
  detailEvent = async (req, res) => res.json({ data: await this.service.detail(req.user, req.validatedParams.eventId) });
  updateEvent = async (req, res) => res.json({ data: await this.service.update(req.user, req.validatedParams.eventId, req.validated) });
  deleteEvent = async (req, res) => { await this.service.delete(req.user, req.validatedParams.eventId); res.status(204).end(); };
}
