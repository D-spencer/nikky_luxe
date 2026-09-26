export default function EmptyProducts({ label = "collection" }: { label?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-monogram">NL</div>
      <h3>New pieces are coming soon.</h3>
      <p>The {label.toLowerCase()} is ready for products to be added from the admin dashboard.</p>
    </div>
  );
}
