import {Theme} from '@astryxdesign/core/theme';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Link} from '@astryxdesign/core/Link';
import {Table, proportional, pixel} from '@astryxdesign/core/Table';
import {VStack} from '@astryxdesign/core/VStack';
import {themes, defaultThemeSlug} from '../astryx-themes';
import {jobs, type Job} from './jobsData';

// One static page. The dataset holds entry level roles only, so there is no
// level filter to render; the location filter is injected after render by
// scripts/inject-location-filter.py because the renderer strips script.

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
        <VStack gap={1}>
          <Heading level={1}>{heading}</Heading>
          <Text type="supporting" color="secondary">
            {jobs.length} open roles within about a 45-minute drive of Arden, NC, newest first.
            Collected from public LinkedIn job listings on November 11, 2026. Each role links to
            its original posting.
          </Text>
          <Text type="supporting" color="secondary">
            Entry level uses LinkedIn's own seniority field, with two overrides from the job title:
            listings LinkedIn marks Not Applicable are classified from the title (junior, trainee,
            apprentice, intern, crew, cashier and similar hourly roles count as entry level), and
            titles showing rank above entry level (manager, director, supervisor, lead, senior,
            foreman, journeyman) or a licensed or credentialed role (physician, dentist,
            pharmacist, dietitian, physical therapist, BCBA, registered nurse, licensed practical
            nurse, veterinarian, veterinary technician, CDL driver, medical lab technician) are
            left out.
          </Text>
        </VStack>
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
