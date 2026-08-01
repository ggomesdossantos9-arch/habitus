export class UserController {
  constructor(service) {
    this.service = service;
  }

  me = async (req, res) => res.json({ data: this.service.profile(req.user) });
  update = async (req, res) => res.json({ data: await this.service.updateProfile(req.user, req.validated) });
  changePassword = async (req, res) => { await this.service.changePassword(req.user, req.validated); res.status(204).end(); };
  deleteAccount = async (req, res) => { await this.service.deleteAccount(req.user, req.validated); res.status(204).end(); };
  consents = async (req, res) => res.json({ data: await this.service.listConsents(req.user) });
  addConsent = async (req, res) => res.status(201).json({ data: await this.service.addConsentEvent(req.user, req.validated) });
}
