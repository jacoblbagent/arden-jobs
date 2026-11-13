import {Theme} from '@astryxdesign/core/theme';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Table, proportional, pixel} from '@astryxdesign/core/Table';
import {VStack} from '@astryxdesign/core/VStack';
import {themes, defaultThemeSlug} from '../astryx-themes';
import {jobs, type Job} from './jobsData';

// One static page. The dataset holds entry level roles only, so there is no
// level filter to render; the location filter is injected after render by
// scripts/inject-location-filter.py because the renderer strips script.

// Open-posting glyph for the icon button beside each title: the document with
// an arrow leaving it, drawn inline so the renderer carries it into the static
// page without an icon dependency.
function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13 4h7v7" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
    </svg>
  );
}

const columns = [
  {
    key: 'title' as const,
    header: 'Role',
    width: proportional(2.2, {minWidth: 240}),
    // The title is text, not a link: the posting opens from the icon button to
    // its right. That button is a plain <a> rather than Astryx Link +
    // IconButton, because a button inside an anchor is invalid markup and the
    // styles must survive the static renderer. target="_blank" with rel by hand
    // so no window.opener handle leaks to the posting. scripts/job-link.css
    // draws the button, and every injector still finds the posting id at the
    // end of this href.
    renderCell: (job: Job) => (
      <div className="job-title-cell">
        <span className="job-title-text">{job.title}</span>
        <a
          className="job-link-btn"
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the ${job.title} posting on LinkedIn`}
          title="Open posting"
        >
          <OpenIcon />
        </a>
      </div>
    ),
  },
  {
    key: 'company' as const,
    header: 'Company',
    width: proportional(1.2, {minWidth: 140}),
    renderCell: (job: Job) => <Text type="body">{job.company}</Text>,
  },
  {
    key: 'location' as const,
    header: 'Location',
    width: pixel(180),
    renderCell: (job: Job) => <Text type="body" color="secondary">{job.location}</Text>,
  },
  {
    key: 'posted' as const,
    header: 'Posted',
    width: pixel(120),
    align: 'end' as const,
    renderCell: (job: Job) => (
      <Text type="body" color="secondary" hasTabularNumbers>
        {job.posted}
      </Text>
    ),
  },
];

export default function JobsPage({heading}: {heading: string}) {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <VStack gap={4} padding={6}>
        <Heading level={1}>{heading}</Heading>
        <Table<Job>
          data={jobs}
          columns={columns}
          idKey="id"
          density="compact"
          dividers="rows"
          isStriped
          hasHover
        />
      </VStack>
    </Theme>
  );
}

export {jobs};
