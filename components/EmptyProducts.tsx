export default function EmptyProducts({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-monogram">NL</div>
      <h3>New pieces are coming soon.</h3>
      <p>More {label.toLowerCase()} pieces will be available soon.</p>
    </div>
  );
}