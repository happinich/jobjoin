import hints from '../../config/field-hints.json' with { type: 'json' };

export interface FieldHints {
  login: { username: string[]; password: string[]; submit: string[] };
  repost: { form: string[]; sourceUrl: string[]; title: string[]; body: string[]; tags: string[]; submit: string[] };
}

export const fieldHints = hints as FieldHints;
