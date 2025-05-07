export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-6">
      <div className="container mx-auto px-4 py-3 text-center text-sm text-muted-foreground">
        ShiftTracker © {new Date().getFullYear()} • 
        <a href="#" className="text-primary ml-1 mr-1">Privacy Policy</a> • 
        <a href="#" className="text-primary ml-1">Terms of Service</a>
      </div>
    </footer>
  );
}
