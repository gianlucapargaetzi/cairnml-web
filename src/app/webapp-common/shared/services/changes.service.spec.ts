import {
  latestSeen,
  releaseNotesToHtml,
  releasesNewestFirst,
  unseenChanges
} from './changes.service';

const bundle = {
  server: {'0.0.5': 'Old.', '0.0.6': '- New server line.\n- Second.', '2.41': 'not a release'},
  web: {'0.0.5': '- Web now.'},
};

describe('What\'s new', () => {
  it('orders the releases newest first, leaving out what is not a release', () => {
    expect(releasesNewestFirst(bundle.server)).toEqual(['0.0.6', '0.0.5']);
  });

  it('shows the current release of each component to a user with no seen state', () => {
    const changes = unseenChanges(bundle, null);
    expect(changes.map(c => c.title)).toEqual(['Server 0.0.6', 'Web app 0.0.5']);
  });

  it('shows only the releases newer than the seen version', () => {
    const changes = unseenChanges(bundle, {server: '0.0.5', web: '0.0.5'});
    expect(changes.map(c => c.title)).toEqual(['Server 0.0.6']);
  });

  it('shows nothing when every component is seen', () => {
    expect(unseenChanges(bundle, {server: '0.0.6', web: '0.0.5'})).toEqual([]);
  });

  it('records the newest version of each component as seen', () => {
    expect(latestSeen(bundle)).toEqual({server: '0.0.6', web: '0.0.5'});
  });

  it('escapes the notes and makes each line a paragraph', () => {
    expect(releaseNotesToHtml('- a <b>tag</b>\n\nplain & simple')).toBe('<p>• a &lt;b&gt;tag&lt;/b&gt;</p><p>plain &amp; simple</p>');
  });
});
