import { ArrowLeft, Sparkles } from 'lucide-react';
import { releaseNotes } from './releaseNotes';

type Props = {
  onBack: () => void;
};

function displayDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function WhatsNew({ onBack }: Props) {
  return (
    <main className="whats-new-page">
      <article className="whats-new-content">
        <button className="whats-new-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to the lab
        </button>

        <header className="whats-new-hero">
          <div className="whats-new-icon" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="eyebrow">RELEASE NOTES</p>
            <h1>What&apos;s new</h1>
            <p>
              Meaningful changes grouped by deployment, including what is queued for the next
              version of the formatting lab.
            </p>
          </div>
        </header>

        <div className="release-list">
          {releaseNotes.map((release) => (
            <section
              className={`release-card ${release.publishedOn ? '' : 'upcoming'}`}
              key={release.version}
              aria-labelledby={`release-${release.version}`}
            >
              <div className="release-meta">
                <span className="release-version">Version {release.version}</span>
                {release.publishedOn ? (
                  <time dateTime={release.publishedOn}>{displayDate(release.publishedOn)}</time>
                ) : (
                  <span className="release-status">Next deployment</span>
                )}
              </div>
              <h2 id={`release-${release.version}`}>{release.title}</h2>
              <p className="release-summary">{release.summary}</p>
              <ul className="release-changes">
                {release.changes.map((change) => (
                  <li key={change.title}>
                    <strong>{change.title}</strong>
                    <span>{change.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
