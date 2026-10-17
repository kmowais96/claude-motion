// Section 6: one line (sections 6–8 are a single unbroken line; see lib/oneline/film.js)
import { register, renderSec, eventsSec } from '../lib/oneline/film.js';
export default {
  style: 'oneline',
  page: 'p. 4',
  async init(T) { register(6, T); },
  render(ctx, t, T) { renderSec(6, ctx, t); },
  texts() { return []; },
  events(T) { return eventsSec(6); },
};
