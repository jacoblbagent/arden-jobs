import {Theme} from '@astryxdesign/core/theme';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Link} from '@astryxdesign/core/Link';
import {Button} from '@astryxdesign/core/Button';
import {Table, proportional, pixel} from '@astryxdesign/core/Table';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {themes, defaultThemeSlug} from '../astryx-themes';
import {jobs as allJobs, type Job} from './jobsData';

// Three static views stand in for a filter: this file renders no script, so
// "entry level only" is a separate page rather than a checkbox. Counts and
// links live in one place so the numbers can never drift from the pages.
const entryJobs = allJobs.filter((job) => job.level === 'Entry level');
const otherJobs = allJobs.filter((job) => job.level !== 'Entry level');

const views = [
  {slug: 'index.html', label: 'All roles', count: allJobs.length},
  {slug: 'entry-level.html', label: 'Entry level', count: entryJobs.length},
  {slug: 'not-entry-level.html', label: 'Not entry level', count: otherJobs.length},
];

function FilterBar({current}: {current: string}) {
  return (
    <HStack gap={2} vAlign="center">
      <Text type="label" color="secondary">
        Filter
      </Text>
      {views.map((view) =>
        view.slug === current ? (
          // Active view: a primary button with nothing to navigate to.
          <Button key={view.slug} size="sm" variant="primary" label={`${view.label} (${view.count})`} />
        ) : (
          <Button
            key={view.slug}
            size="sm"
            variant="secondary"
            label={`${view.label} (${view.count})`}
            href={'./' + view.slug}
          />
        ),
      )}
    </HStack>
  );
}

const columns = [
  {
    key: 'title' as const,
    header: 'Role',
    width: proportional(2.2, {minWidth: 240}),
    renderCell: (job: Job) => <Link href={job.url}>{job.title}</Link>,
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
    key: 'level' as const,
    header: 'Level',
    width: pixel(150),
    renderCell: (job: Job) => <Text type="body" color="secondary">{job.levelText}</Text>,
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

export default function JobsPage({current, rows, heading}: {current: string; rows: Job[]; heading: string}) {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <VStack gap={4} padding={6}>
        <VStack gap={2}>
          <VStack gap={1}>
            <Heading level={1}>{heading}</Heading>
            <Text type="supporting" color="secondary">
              {rows.length} open roles within about a 45-minute drive of Arden, NC, newest first.
              Collected from public LinkedIn job listings on November 11, 2026. Each role links to
              its original posting.
            </Text>
            <Text type="supporting" color="secondary">
              Level is LinkedIn's own seniority field. Listings LinkedIn marks Not Applicable are
              classified from the job title (junior, trainee, apprentice, intern, crew, cashier and
              similar hourly roles count as entry level).
            </Text>
          </VStack>
          <FilterBar current={current} />
        </VStack>
        <Table<Job>
          data={rows}
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

export {allJobs, entryJobs, otherJobs};
