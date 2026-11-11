import JobsPage, {allJobs} from './JobsPage';

// All listings, unfiltered.
export default function Page() {
  return <JobsPage current="index.html" heading="Jobs around Arden, NC" rows={allJobs} />;
}
