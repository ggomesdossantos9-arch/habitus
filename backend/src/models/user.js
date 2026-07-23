export function toPublicUser(user) {
  return {
    id: user.public_id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    locale: user.locale,
    createdAt: user.created_at,
  };
}
