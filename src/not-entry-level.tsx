import JobsPage, {otherJobs} from './JobsPage';

// Everything above entry level: associate, mid-senior, director, executive.
export default function Page() {
  return (
    <JobsPage
      current="not-entry-level.html"
      heading="Jobs above entry level around Arden, NC"
      rows={otherJobs}
    />
  );
}
