// Section 8: one line (sections 6–8 are a single unbroken line; see lib/oneline/film.js)
import { register, renderSec, eventsSec } from '../lib/oneline/film.js';
export default {
  style: 'oneline',
  page: 'p. 6',
  async init(T) { register(8, T); },
  render(ctx, t, T) { renderSec(8, ctx, t); },
  texts() { return []; },
  events(T) { return eventsSec(8); },
};
