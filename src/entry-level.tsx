import JobsPage, {entryJobs} from './JobsPage';

// Entry-level view: LinkedIn seniority "Entry level"/"Internship", plus titles
// that read entry level where LinkedIn says Not Applicable.
export default function Page() {
  return (
    <JobsPage
      current="entry-level.html"
      heading="Entry level jobs around Arden, NC"
      rows={entryJobs}
    />
  );
}
